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

test("vocabulary page header and add panel smoke", async ({ browser, baseURL }) => {
  test.skip(
    missingAppEnv.length > 0,
    `E2E requires ${missingAppEnv.join(", ")}. Set app env to run this flow.`,
  );

  const sessionToken = randomUUID();
  let context: Awaited<ReturnType<typeof browser.newContext>> | null = null;
  let userId: string | null = null;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  try {
    userId = await seedUserWithSession({
      email: `vocabulary-smoke-${randomUUID()}@example.com`,
      name: "Vocabulary Smoke",
      sessionToken,
    });
    await prisma.vocabularyEntry.create({
      data: {
        ownerId: userId,
        source: "manual",
        word: "observability",
      },
    });
    context = await browser.newContext();
    await context.addCookies([
      buildSessionCookie({
        baseURL,
        sessionToken,
      }),
    ]);

    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error" && !isIgnoredConsoleError(message.text())) {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/vocabulary");

    await expect(page.getByRole("heading", { level: 1, name: "Vocabulary" })).toBeVisible();
    await expect(page.getByPlaceholder("Search vocabulary...")).toBeVisible();
    await expect(page.getByText("Add word", { exact: true })).toBeVisible();
    await expect(page.getByText("Import", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Export" })).toHaveAttribute(
      "href",
      "/api/vocabulary",
    );
    await expect(page.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
    await expect(page.getByPlaceholder("Add a word...")).toBeHidden();
    await expect(page.getByLabel("Vocabulary JSON file")).toBeHidden();

    const vocabularyRow = page.getByRole("row").filter({ hasText: "observability" });
    const rowBoxBeforeLinks = await vocabularyRow.boundingBox();
    const openLinksButton = vocabularyRow.getByText("Open links", { exact: true });

    await openLinksButton.click();

    const lookupMenu = page.getByRole("link", { name: "Vocabulary.com" }).locator("..");
    await expect(lookupMenu).toBeVisible();
    const rowBoxAfterLinks = await vocabularyRow.boundingBox();
    const lookupMenuBox = await lookupMenu.boundingBox();

    expect(lookupMenuBox?.width).toBeLessThanOrEqual(260);
    expect(rowBoxAfterLinks?.height).toBeLessThanOrEqual((rowBoxBeforeLinks?.height ?? 0) + 10);

    await page.getByRole("heading", { level: 1, name: "Vocabulary" }).click();
    await expect(page.getByRole("link", { name: "Vocabulary.com" })).toBeHidden();

    const wordListButton = vocabularyRow.getByText("Add to Word List", { exact: true });
    await wordListButton.click();
    await expect(page.getByRole("button", { name: "Save lists" })).toBeVisible();
    await page.getByPlaceholder("Search vocabulary...").click();
    await expect(page.getByRole("button", { name: "Save lists" })).toBeHidden();

    await openLinksButton.click();
    await expect(page.getByRole("link", { name: "Vocabulary.com" })).toBeVisible();
    await openLinksButton.click();
    await expect(page.getByRole("link", { name: "Vocabulary.com" })).toBeHidden();

    await page.getByText("Add word", { exact: true }).click();

    await expect(page.getByPlaceholder("Add a word...")).toBeVisible();
    await page.getByPlaceholder("Search vocabulary...").click();
    await expect(page.getByPlaceholder("Add a word...")).toBeHidden();

    await page.getByText("Add word", { exact: true }).click();
    await page.getByPlaceholder("Add a word...").fill("smokeword");
    await page.getByRole("button", { name: "Save word" }).click();

    await expect(page.getByPlaceholder("Add a word...")).toBeHidden();
    await expect(page.getByRole("cell", { name: "smokeword" })).toBeVisible();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } finally {
    await context?.close();
    await prisma.session.deleteMany({
      where: {
        sessionToken,
      },
    });

    if (userId) {
      await prisma.user.deleteMany({
        where: {
          id: userId,
        },
      });
    }
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

async function seedUserWithSession(input: {
  email: string;
  name: string;
  sessionToken: string;
}) {
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      sessions: {
        create: {
          expires: new Date(Date.now() + 60 * 60 * 1000),
          sessionToken: input.sessionToken,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return user.id;
}

function isIgnoredConsoleError(message: string) {
  return message.includes("/_next/webpack-hmr");
}
