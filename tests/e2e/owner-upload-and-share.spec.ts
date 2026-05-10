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
    await seedUserWordListPreference({
      userId: ownerIdentity.userId,
      wordListSlug: "cet4",
    });

    await ownerContext.addCookies([
      buildSessionCookie({
        baseURL,
        sessionToken: ownerSessionToken,
      }),
    ]);

    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/documents");

    await ownerPage.locator('input[name="file"]').setInputFiles({
      name: "study-notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(
        "# Study Notes\n\nability and benefit improve culture.\n\nThis paragraph stays plain.",
        "utf8",
      ),
    });

    await expect(ownerPage.getByRole("heading", { level: 1, name: "study-notes" })).toBeVisible();
    await expect(ownerPage.getByText("study-notes.md")).toBeVisible();

    const ownerHighlight = ownerPage.getByTitle(/Highlights: ability/).filter({ hasText: "ability" });
    await expect(ownerHighlight).toBeVisible();

    const documentId = ownerPage.url().split("/").pop();

    if (!documentId) {
      throw new Error("Missing document id after upload");
    }

    await seedAnnotationForQuote({
      documentId,
      note: "Owner note for shared viewer.",
      ownerId: ownerIdentity.userId,
      quote: "ability",
    });

    await ownerPage.getByRole("button", { name: "Share read-only" }).click();

    let shareToken: string | null = null;
    await expect
      .poll(async () => {
        const share = await prisma.documentShare.findUnique({
          where: {
            documentId,
          },
          select: {
            token: true,
            isActive: true,
          },
        });

        shareToken = share?.isActive ? share.token : null;
        return shareToken;
      })
      .not.toBeNull();

    if (!shareToken) {
      throw new Error("Missing share token");
    }

    const shareHref = new URL(`/shared/${shareToken}`, baseURL ?? "http://127.0.0.1:3000").toString();

    const anonymousPage = await anonymousContext.newPage();
    await anonymousPage.goto(shareHref);
    const expectedCallbackUrl = new URLSearchParams({
      callbackUrl: new URL(shareHref).pathname,
    }).toString();
    await expect(anonymousPage).toHaveURL(new RegExp(`/sign-in\\?${expectedCallbackUrl}$`));
    await expect(
      anonymousPage.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeVisible();

    await viewerContext.addCookies([
      buildSessionCookie({
        baseURL,
        sessionToken: viewerSessionToken,
      }),
    ]);

    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto(shareHref);

    await expect(viewerPage.getByRole("heading", { level: 1, name: "study-notes" })).toBeVisible();
    await expect(viewerPage.getByText("This is a read-only shared document.")).toBeVisible();
    await expect(
      viewerPage.getByTitle(/Highlights: ability/).filter({ hasText: "ability" }),
    ).toBeVisible();
    await expect(viewerPage.getByText("Owner note for shared viewer.")).toBeVisible();
    await expect(viewerPage.getByRole("button", { name: "Share read-only" })).toHaveCount(0);
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

async function seedUserWordListPreference(input: {
  userId: string;
  wordListSlug: string;
}) {
  const wordList = await prisma.wordList.findUnique({
    where: {
      slug: input.wordListSlug,
    },
    select: {
      id: true,
    },
  });

  if (!wordList) {
    throw new Error(`Missing word list: ${input.wordListSlug}`);
  }

  await prisma.userWordListPreference.create({
    data: {
      userId: input.userId,
      wordListId: wordList.id,
    },
  });
}

async function seedAnnotationForQuote(input: {
  documentId: string;
  ownerId: string;
  quote: string;
  note: string;
}) {
  const document = await prisma.document.findUnique({
    where: {
      id: input.documentId,
    },
    select: {
      blocks: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          blockKey: true,
          text: true,
        },
      },
    },
  });
  const matchingBlock = document?.blocks.find((block) => block.text.includes(input.quote));

  if (!matchingBlock) {
    throw new Error(`Missing quote in uploaded document: ${input.quote}`);
  }

  const startOffset = matchingBlock.text.indexOf(input.quote);
  const endOffset = startOffset + input.quote.length;

  await prisma.annotation.create({
    data: {
      documentId: input.documentId,
      ownerId: input.ownerId,
      startBlockKey: matchingBlock.blockKey,
      startOffset,
      endBlockKey: matchingBlock.blockKey,
      endOffset,
      quote: input.quote,
      note: input.note,
      color: "yellow",
      tags: [],
    },
  });
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
