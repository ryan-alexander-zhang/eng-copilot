import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const missingAppEnv = ["DATABASE_URL", "NEXTAUTH_SECRET"].filter(
  (name) => !process.env[name],
);

test("owner uploads a document and a shared viewer can read it", async ({ browser, baseURL }) => {
  test.skip(
    missingAppEnv.length > 0,
    `E2E requires ${missingAppEnv.join(", ")}. Set app env to run this flow.`,
  );

  const ownerSessionToken = randomUUID();
  const viewerSessionToken = randomUUID();
  let ownerContext:
    | Awaited<ReturnType<typeof browser.newContext>>
    | null = null;
  let anonymousContext:
    | Awaited<ReturnType<typeof browser.newContext>>
    | null = null;
  let viewerContext:
    | Awaited<ReturnType<typeof browser.newContext>>
    | null = null;
  let ownerIdentity: { userId: string } | null = null;
  let viewerIdentity: { userId: string } | null = null;

  try {
    const missingPrerequisites = await getMissingPrerequisites();

    test.skip(
      missingPrerequisites.length > 0,
      `E2E requires ${missingPrerequisites.join(", ")} before the flow can run.`,
    );

    ownerContext = await browser.newContext();
    anonymousContext = await browser.newContext();
    viewerContext = await browser.newContext();
    ownerIdentity = await seedUserWithSession({
      email: `owner-${randomUUID()}@example.com`,
      name: "E2E Owner",
      sessionToken: ownerSessionToken,
    });
    viewerIdentity = await seedUserWithSession({
      email: `viewer-${randomUUID()}@example.com`,
      name: "E2E Viewer",
      sessionToken: viewerSessionToken,
    });

    await ownerContext.addCookies([
      buildSessionCookie({
        baseURL,
        sessionToken: ownerSessionToken,
      }),
    ]);

    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/documents");

    await ownerPage.getByRole("link", { name: "Upload a document" }).click();
    await ownerPage.getByLabel("Markdown file").setInputFiles({
      name: "study-notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(
        "# Study Notes\n\nability and benefit improve culture.\n\nThis paragraph stays plain.",
        "utf8",
      ),
    });
    await ownerPage.getByRole("button", { name: "Upload document" }).click();

    await expect(ownerPage.getByRole("heading", { level: 1, name: "study-notes" })).toBeVisible();
    await expect(ownerPage.getByText("study-notes.md")).toBeVisible();

    await ownerPage.getByLabel("CET4").check();
    await ownerPage.getByRole("button", { name: "Update highlights" }).click();

    const ownerHighlight = ownerPage.getByTitle(/Highlights: ability/).filter({ hasText: "ability" });
    await expect(ownerHighlight).toBeVisible();

    await ownerPage.getByLabel("Start offset").fill("0");
    await ownerPage.getByLabel("End offset").fill("7");
    await ownerPage.getByLabel("Note").fill("Owner note for shared viewer.");
    await ownerPage.getByRole("button", { name: "Create annotation" }).click();

    await expect(ownerPage.getByText("Quote: ability")).toBeVisible();
    await expect(ownerPage.getByText("Owner note for shared viewer.")).toBeVisible();

    await ownerPage.getByRole("button", { name: "Enable share link" }).click();

    const shareLink = ownerPage.getByRole("link", { name: /\/shared\// });
    await expect(shareLink).toBeVisible();
    const shareHref = await shareLink.getAttribute("href");

    if (!shareHref) {
      throw new Error("Missing share href");
    }

    const anonymousPage = await anonymousContext.newPage();
    await anonymousPage.goto(shareHref);
    const expectedCallbackUrl = new URLSearchParams({
      callbackUrl: shareHref,
    }).toString();
    await expect(anonymousPage).toHaveURL(new RegExp(`/sign-in\\?${expectedCallbackUrl}$`));
    await expect(
      anonymousPage.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeVisible();

    await viewerContext.addCookies([
      buildSessionCookie({
        baseURL,
        sessionToken: viewerSessionToken,
      }),
    ]);

    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto(shareHref);

    await expect(viewerPage.getByRole("heading", { level: 1, name: "Read-only shared view" })).toBeVisible();
    await expect(viewerPage.getByRole("heading", { level: 2, name: "study-notes" })).toBeVisible();
    await expect(
      viewerPage.getByTitle(/Highlights: ability/).filter({ hasText: "ability" }),
    ).toBeVisible();
    await expect(
      viewerPage.locator('span[title*="Annotations:"]').filter({ hasText: "ability" }).first(),
    ).toBeVisible();
    await expect(viewerPage.getByRole("button", { name: "Update highlights" })).toHaveCount(0);
    await expect(viewerPage.getByRole("button", { name: "Create annotation" })).toHaveCount(0);
    await expect(viewerPage.getByRole("button", { name: "Enable share link" })).toHaveCount(0);
  } finally {
    await ownerContext?.close();
    await anonymousContext?.close();
    await viewerContext?.close();
    await prisma.session.deleteMany({
      where: {
        sessionToken: {
          in: [ownerSessionToken, viewerSessionToken],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [ownerIdentity?.userId, viewerIdentity?.userId].filter(
            (value): value is string => Boolean(value),
          ),
        },
      },
    });
  }
});

function buildSessionCookie(input: { baseURL: string | undefined; sessionToken: string }) {
  const url = new URL(input.baseURL ?? "http://127.0.0.1:3000");

  return {
    name: "authjs.session-token",
    value: input.sessionToken,
    domain: url.hostname,
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}

async function getMissingPrerequisites() {
  const cet4 = await prisma.wordList.findUnique({
    where: {
      slug: "cet4",
    },
    select: {
      entries: {
        where: {
          term: "ability",
        },
        select: {
          id: true,
        },
      },
    },
  });
  const builtInExclusion = await prisma.wordList.findUnique({
    where: {
      slug: "builtin-exclusion",
    },
    select: {
      id: true,
    },
  });
  const missing: string[] = [];

  if (!cet4?.entries.length) {
    missing.push("seeded CET4 word list entries");
  }

  if (!builtInExclusion) {
    missing.push("seeded built-in exclusion list");
  }

  return missing;
}

async function seedUserWithSession(input: {
  email: string;
  name: string;
  sessionToken: string;
}) {
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      sessions: {
        create: {
          expires,
          sessionToken: input.sessionToken,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return {
    userId: user.id,
  };
}
