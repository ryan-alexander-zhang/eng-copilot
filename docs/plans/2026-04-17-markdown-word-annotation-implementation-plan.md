# Markdown Word Annotation MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app where Google-authenticated owners can upload Markdown documents, apply built-in vocabulary lists with built-in exclusions, create persistent annotations, and share a read-only study view with any signed-in Google user who has the link.

**Architecture:** Implement the MVP as a modular monolith in Next.js App Router. Persist users, documents, parsed blocks, active word-list selections, highlight matches, annotations, and share links in PostgreSQL through Prisma. Keep the source Markdown immutable after upload and anchor both highlights and annotations to stable block keys plus text offsets.

**Tech Stack:** `next 16.2.4`, `react 19.2.5`, `react-dom 19.2.5`, `typescript 6.0.2`, `next-auth 4.24.14`, `@prisma/client`, `prisma`, `zod`, `react-hook-form`, `react-markdown` only for simple non-annotated fallbacks, `remark-parse`, `unist-util-visit`, `vitest`, `@testing-library/react`, `playwright`

---

## Scope Check

This spec is still one coherent subsystem. It is greenfield, but the work hangs together around one product slice:

- app shell and auth
- Markdown ingestion and persistence
- study-layer computation
- owner editing
- authenticated read-only sharing

Do not split this into multiple plan files yet.

## Planned File Structure

### Root App And Tooling

- `package.json`: dependencies, scripts
- `next.config.ts`: Next.js config
- `tsconfig.json`: TypeScript config
- `eslint.config.mjs`: lint config
- `vitest.config.ts`: unit test config
- `playwright.config.ts`: end-to-end config
- `.env.example`: required environment variables

### Database And Seed Data

- `prisma/schema.prisma`: auth tables plus document domain tables
- `prisma/seed.ts`: seed built-in word lists and exclusion entries
- `src/lib/db.ts`: singleton Prisma client
- `vendor/word-lists/cet4.txt`: newline-delimited built-in CET4 words
- `vendor/word-lists/cet6.txt`: newline-delimited built-in CET6 words
- `vendor/word-lists/exclusion.txt`: newline-delimited built-in exclusions

### Auth And Route Guards

- `src/lib/auth.ts`: shared Auth.js config and `getRequiredSession`
- `src/app/api/auth/[...nextauth]/route.ts`: Auth.js route handler
- `src/app/(app)/layout.tsx`: authenticated owner shell
- `src/app/(app)/page.tsx`: owner landing page redirecting to documents
- `src/app/sign-in/page.tsx`: Google sign-in page

### Domain Services

- `src/lib/markdown/parse-markdown-to-blocks.ts`: parse raw Markdown into stable blocks
- `src/lib/highlights/tokenize-block-text.ts`: tokenize block text
- `src/lib/highlights/compute-highlight-matches.ts`: derive matches from blocks plus active lists
- `src/lib/highlights/recompute-document-highlights.ts`: persist new matches for a document
- `src/lib/documents/create-document-from-upload.ts`: validate upload, persist document, parse blocks, seed highlights
- `src/lib/documents/get-owner-document.ts`: owner-only document read model
- `src/lib/documents/get-shared-document.ts`: shared viewer read model
- `src/lib/annotations/create-annotation.ts`: owner annotation creation
- `src/lib/annotations/update-annotation.ts`: owner annotation update
- `src/lib/annotations/delete-annotation.ts`: owner annotation deletion
- `src/lib/shares/enable-document-share.ts`: create or rotate token
- `src/lib/shares/revoke-document-share.ts`: disable token

### UI

- `src/app/(app)/documents/page.tsx`: owner document list
- `src/app/(app)/documents/new/page.tsx`: upload page
- `src/app/(app)/documents/[documentId]/page.tsx`: owner document reader
- `src/app/shared/[token]/page.tsx`: shared read-only reader
- `src/components/documents/upload-form.tsx`: upload form
- `src/components/documents/document-list.tsx`: owner list
- `src/components/documents/document-reader.tsx`: block renderer with highlights and annotation marks
- `src/components/documents/annotation-panel.tsx`: annotation list and edit form
- `src/components/documents/list-toggle-form.tsx`: built-in list activation controls
- `src/components/documents/share-panel.tsx`: enable and revoke sharing

### Tests

- `tests/unit/app-shell.test.tsx`
- `tests/unit/word-lists/catalog.test.ts`
- `tests/unit/highlights/compute-highlight-matches.test.ts`
- `tests/unit/documents/create-document-from-upload.test.ts`
- `tests/unit/annotations/build-annotation-segments.test.ts`
- `tests/unit/shares/get-shared-document.test.ts`
- `tests/e2e/owner-upload-and-share.spec.ts`
- `docs/operations/google-auth-smoke-checklist.md`

## Dependencies And Pre-Work

- Commit vetted UTF-8 newline-delimited source files for `CET4`, `CET6`, and the built-in exclusion list into `vendor/word-lists/` before running the seed command.
- Create a Google OAuth app for local development and store the client ID and secret in `.env.local`.
- Provision a PostgreSQL database for local development and one separate database for automated tests.

### Task 1: Bootstrap The Next.js App Shell

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Test: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write the failing app-shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders the product heading", async () => {
    render(await RootPage());
    expect(
      screen.getByRole("heading", { name: "Markdown Word Annotation" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/app-shell.test.tsx`
Expected: FAIL with module resolution errors because the app shell does not exist yet.

- [ ] **Step 3: Write the minimal app shell and tooling**

```json
{
  "name": "eng-copilot",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Markdown Word Annotation",
  description: "Markdown-first reading with highlights and annotations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// src/app/page.tsx
export default async function RootPage() {
  return (
    <main>
      <h1>Markdown Word Annotation</h1>
      <p>Upload Markdown, highlight vocabulary, annotate text, and share read-only study views.</p>
    </main>
  );
}
```

- [ ] **Step 4: Run tests and basic checks**

Run: `npm run test -- tests/unit/app-shell.test.tsx && npm run lint`
Expected: PASS for the unit test and no lint errors.

- [ ] **Step 5: Commit**

```bash
git add package.json next.config.ts tsconfig.json eslint.config.mjs vitest.config.ts playwright.config.ts .env.example src/app/layout.tsx src/app/page.tsx tests/unit/app-shell.test.tsx
git commit -m "chore: bootstrap next app shell"
```

### Task 2: Add Prisma Schema And Built-In Word List Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/word-lists/catalog.ts`
- Create: `vendor/word-lists/cet4.txt`
- Create: `vendor/word-lists/cet6.txt`
- Create: `vendor/word-lists/exclusion.txt`
- Test: `tests/unit/word-lists/catalog.test.ts`

- [ ] **Step 1: Write the failing built-in-list catalog test**

```ts
import { describe, expect, it } from "vitest";
import { BUILT_IN_LISTS, BUILT_IN_EXCLUSION_SLUG } from "@/lib/word-lists/catalog";

describe("built-in word-list catalog", () => {
  it("declares CET4, CET6, and one exclusion list", () => {
    expect(BUILT_IN_LISTS.map((list) => list.slug)).toEqual(["cet4", "cet6"]);
    expect(BUILT_IN_EXCLUSION_SLUG).toBe("builtin-exclusion");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/word-lists/catalog.test.ts`
Expected: FAIL because the catalog module does not exist.

- [ ] **Step 3: Add the schema, Prisma client, list catalog, and seed loader**

```prisma
model User {
  id            String          @id @default(cuid())
  name          String?
  email         String?         @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  documents     Document[]
  annotations   Annotation[]
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Document {
  id              String             @id @default(cuid())
  ownerId         String
  title           String
  originalName    String
  rawMarkdown     String             @db.Text
  shareEnabled    Boolean            @default(false)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  owner           User               @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  blocks          DocumentBlock[]
  activeLists     DocumentWordList[]
  highlightMatches HighlightMatch[]
  annotations     Annotation[]
  share           DocumentShare?
}

model DocumentBlock {
  id         String   @id @default(cuid())
  documentId String
  blockKey   String
  sortOrder  Int
  kind       String
  text       String   @db.Text
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, blockKey])
}

model DocumentWordList {
  id         String   @id @default(cuid())
  documentId String
  wordListId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  wordList   WordList @relation(fields: [wordListId], references: [id], onDelete: Cascade)

  @@unique([documentId, wordListId])
}

model WordList {
  id        String          @id @default(cuid())
  slug      String          @unique
  name      String
  kind      WordListKind
  entries   WordListEntry[]
}

model WordListEntry {
  id         String   @id @default(cuid())
  wordListId String
  term       String
  wordList   WordList @relation(fields: [wordListId], references: [id], onDelete: Cascade)

  @@unique([wordListId, term])
}

enum WordListKind {
  POSITIVE
  EXCLUSION
}

model HighlightMatch {
  id          String   @id @default(cuid())
  documentId  String
  blockKey    String
  startOffset Int
  endOffset   Int
  term        String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

model Annotation {
  id            String   @id @default(cuid())
  documentId    String
  ownerId       String
  startBlockKey String
  startOffset   Int
  endBlockKey   String
  endOffset     Int
  quote         String   @db.Text
  note          String   @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  document      Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  owner         User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
}

model DocumentShare {
  id         String   @id @default(cuid())
  documentId String   @unique
  token      String   @unique
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

```ts
// src/lib/word-lists/catalog.ts
export const BUILT_IN_LISTS = [
  { slug: "cet4", name: "CET4" },
  { slug: "cet6", name: "CET6" },
] as const;

export const BUILT_IN_EXCLUSION_SLUG = "builtin-exclusion";
```

```ts
// prisma/seed.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient, WordListKind } from "@prisma/client";
import { BUILT_IN_EXCLUSION_SLUG, BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

const prisma = new PrismaClient();

async function loadTerms(fileName: string) {
  const raw = await readFile(join(process.cwd(), "vendor/word-lists", fileName), "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}
```

```ts
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: Validate the schema and tests**

Run: `npm run test -- tests/unit/word-lists/catalog.test.ts && npx prisma validate`
Expected: PASS for the test and `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/lib/db.ts src/lib/word-lists/catalog.ts vendor/word-lists/cet4.txt vendor/word-lists/cet6.txt vendor/word-lists/exclusion.txt tests/unit/word-lists/catalog.test.ts
git commit -m "feat: add prisma schema and built-in word list seed data"
```

### Task 3: Implement Google Auth And The Protected Owner Shell

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/page.tsx`
- Create: `src/app/sign-in/page.tsx`
- Modify: `.env.example`
- Test: `tests/unit/auth/get-required-session.test.ts`

- [ ] **Step 1: Write the failing auth-guard test**

```ts
import { describe, expect, it, vi } from "vitest";
import { getRequiredSession } from "@/lib/auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => null),
}));

describe("getRequiredSession", () => {
  it("throws when the request is unauthenticated", async () => {
    await expect(getRequiredSession()).rejects.toThrow("UNAUTHENTICATED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/auth/get-required-session.test.ts`
Expected: FAIL because the auth module does not exist.

- [ ] **Step 3: Add Auth.js config and the protected shell**

```ts
// src/lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
};

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
```

```tsx
// src/app/(app)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  try {
    await getRequiredSession();
  } catch {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
```

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 4: Run tests and a route smoke check**

Run: `npm run test -- tests/unit/auth/get-required-session.test.ts`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/[...nextauth]/route.ts src/app/'(app)'/layout.tsx src/app/'(app)'/page.tsx src/app/sign-in/page.tsx .env.example tests/unit/auth/get-required-session.test.ts
git commit -m "feat: add google auth and owner shell"
```

### Task 4: Parse Markdown Into Stable Blocks And Compute Highlights

**Files:**
- Create: `src/lib/markdown/parse-markdown-to-blocks.ts`
- Create: `src/lib/highlights/tokenize-block-text.ts`
- Create: `src/lib/highlights/compute-highlight-matches.ts`
- Test: `tests/unit/highlights/compute-highlight-matches.test.ts`

- [ ] **Step 1: Write the failing highlight-computation test**

```ts
import { describe, expect, it } from "vitest";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";

describe("computeHighlightMatches", () => {
  it("keeps active positive matches and removes excluded terms", () => {
    const blocks = parseMarkdownToBlocks("# Title\n\nalpha beta gamma");
    const matches = computeHighlightMatches({
      blocks,
      activeTerms: new Set(["beta", "gamma"]),
      excludedTerms: new Set(["gamma"]),
    });

    expect(matches).toEqual([
      {
        blockKey: "paragraph:1",
        startOffset: 6,
        endOffset: 10,
        term: "beta",
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/highlights/compute-highlight-matches.test.ts`
Expected: FAIL because the parser and highlight modules do not exist.

- [ ] **Step 3: Implement block parsing and match computation**

```ts
// src/lib/markdown/parse-markdown-to-blocks.ts
import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export type ParsedBlock = {
  blockKey: string;
  sortOrder: number;
  kind: "heading" | "paragraph" | "list-item" | "blockquote" | "code";
  text: string;
};

export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const tree = fromMarkdown(markdown);
  const blocks: ParsedBlock[] = [];
  let index = 0;

  visit(tree, (node) => {
    if (
      node.type === "heading" ||
      node.type === "paragraph" ||
      node.type === "listItem" ||
      node.type === "blockquote" ||
      node.type === "code"
    ) {
      const kind = node.type === "listItem" ? "list-item" : (node.type as ParsedBlock["kind"]);
      blocks.push({
        blockKey: `${kind}:${index}`,
        sortOrder: index,
        kind,
        text: toString(node),
      });
      index += 1;
    }
  });

  return blocks.filter((block) => block.text.trim().length > 0);
}
```

```ts
// src/lib/highlights/compute-highlight-matches.ts
import { ParsedBlock } from "@/lib/markdown/parse-markdown-to-blocks";
import { tokenizeBlockText } from "@/lib/highlights/tokenize-block-text";

export function computeHighlightMatches(input: {
  blocks: ParsedBlock[];
  activeTerms: Set<string>;
  excludedTerms: Set<string>;
}) {
  const matches: Array<{ blockKey: string; startOffset: number; endOffset: number; term: string }> = [];

  for (const block of input.blocks) {
    for (const token of tokenizeBlockText(block.text)) {
      if (!input.activeTerms.has(token.term) || input.excludedTerms.has(token.term)) {
        continue;
      }
      matches.push({
        blockKey: block.blockKey,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        term: token.term,
      });
    }
  }

  return matches;
}
```

```ts
// src/lib/highlights/tokenize-block-text.ts
export function tokenizeBlockText(text: string) {
  return Array.from(text.matchAll(/\b[a-zA-Z][a-zA-Z'-]*\b/g)).flatMap((match) => {
    if (match.index == null) {
      return [];
    }

    return [
      {
        term: match[0].toLowerCase(),
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      },
    ];
  });
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- tests/unit/highlights/compute-highlight-matches.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/parse-markdown-to-blocks.ts src/lib/highlights/tokenize-block-text.ts src/lib/highlights/compute-highlight-matches.ts tests/unit/highlights/compute-highlight-matches.test.ts
git commit -m "feat: parse markdown blocks and compute highlights"
```

### Task 5: Implement Document Upload And Owner Document List

**Files:**
- Create: `src/lib/documents/create-document-from-upload.ts`
- Create: `src/app/(app)/documents/page.tsx`
- Create: `src/app/(app)/documents/new/page.tsx`
- Create: `src/components/documents/upload-form.tsx`
- Create: `src/components/documents/document-list.tsx`
- Test: `tests/unit/documents/create-document-from-upload.test.ts`

- [ ] **Step 1: Write the failing upload-validation test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createDocumentFromUpload } from "@/lib/documents/create-document-from-upload";

describe("createDocumentFromUpload", () => {
  it("rejects non-markdown files", async () => {
    const file = new File(["{}"], "bad.json", { type: "application/json" });

    await expect(
      createDocumentFromUpload({
        ownerId: "user_123",
        file,
        prisma: vi.fn() as never,
      }),
    ).rejects.toThrow("Only Markdown files are supported");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/documents/create-document-from-upload.test.ts`
Expected: FAIL because the upload service does not exist.

- [ ] **Step 3: Implement upload validation and persistence**

```ts
// src/lib/documents/create-document-from-upload.ts
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";

const MAX_MARKDOWN_BYTES = 512 * 1024;

export async function createDocumentFromUpload(input: {
  ownerId: string;
  file: File;
  prisma: typeof import("@/lib/db").prisma;
}) {
  if (!input.file.name.endsWith(".md") && input.file.type !== "text/markdown") {
    throw new Error("Only Markdown files are supported");
  }
  if (input.file.size > MAX_MARKDOWN_BYTES) {
    throw new Error("Markdown uploads must be 512 KB or smaller");
  }

  const rawMarkdown = await input.file.text();
  const blocks = parseMarkdownToBlocks(rawMarkdown);
  const highlightMatches = computeHighlightMatches({
    blocks,
    activeTerms: new Set(),
    excludedTerms: new Set(),
  });

  return input.prisma.document.create({
    data: {
      ownerId: input.ownerId,
      title: input.file.name.replace(/\.md$/i, ""),
      originalName: input.file.name,
      rawMarkdown,
      blocks: {
        createMany: { data: blocks },
      },
      highlightMatches: {
        createMany: { data: highlightMatches },
      },
    },
  });
}
```

- [ ] **Step 4: Run tests and the upload page smoke check**

Run: `npm run test -- tests/unit/documents/create-document-from-upload.test.ts`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents/create-document-from-upload.ts src/app/'(app)'/documents/page.tsx src/app/'(app)'/documents/new/page.tsx src/components/documents/upload-form.tsx src/components/documents/document-list.tsx tests/unit/documents/create-document-from-upload.test.ts
git commit -m "feat: add markdown upload and owner document list"
```

### Task 6: Implement Reader Rendering And Annotation CRUD

**Files:**
- Create: `src/lib/documents/get-owner-document.ts`
- Create: `src/components/documents/document-reader.tsx`
- Create: `src/components/documents/annotation-panel.tsx`
- Create: `src/lib/annotations/create-annotation.ts`
- Create: `src/lib/annotations/update-annotation.ts`
- Create: `src/lib/annotations/delete-annotation.ts`
- Create: `src/app/(app)/documents/[documentId]/page.tsx`
- Test: `tests/unit/annotations/build-annotation-segments.test.ts`

- [ ] **Step 1: Write the failing annotation-segmentation test**

```ts
import { describe, expect, it } from "vitest";
import { buildAnnotationSegments } from "@/components/documents/document-reader";

describe("buildAnnotationSegments", () => {
  it("projects one annotation across multiple blocks", () => {
    const segments = buildAnnotationSegments({
      blocks: [
        { blockKey: "paragraph:0", text: "alpha beta" },
        { blockKey: "paragraph:1", text: "gamma delta" },
      ],
      annotations: [
        {
          id: "ann_1",
          startBlockKey: "paragraph:0",
          startOffset: 6,
          endBlockKey: "paragraph:1",
          endOffset: 5,
        },
      ],
    });

    expect(segments).toEqual({
      "paragraph:0": [{ annotationId: "ann_1", startOffset: 6, endOffset: 10 }],
      "paragraph:1": [{ annotationId: "ann_1", startOffset: 0, endOffset: 5 }],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/annotations/build-annotation-segments.test.ts`
Expected: FAIL because the reader module does not exist.

- [ ] **Step 3: Implement the owner reader and annotation services**

```ts
// src/lib/annotations/create-annotation.ts
export async function createAnnotation(input: {
  prisma: typeof import("@/lib/db").prisma;
  documentId: string;
  ownerId: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
  quote: string;
  note: string;
}) {
  return input.prisma.annotation.create({
    data: {
      documentId: input.documentId,
      ownerId: input.ownerId,
      startBlockKey: input.startBlockKey,
      startOffset: input.startOffset,
      endBlockKey: input.endBlockKey,
      endOffset: input.endOffset,
      quote: input.quote,
      note: input.note,
    },
  });
}
```

```ts
// src/lib/documents/get-owner-document.ts
export async function getOwnerDocument(input: {
  prisma: typeof import("@/lib/db").prisma;
  documentId: string;
  ownerId: string;
}) {
  return input.prisma.document.findFirstOrThrow({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
    },
    include: {
      blocks: { orderBy: { sortOrder: "asc" } },
      activeLists: { include: { wordList: true } },
      highlightMatches: true,
      annotations: true,
      share: true,
    },
  });
}
```

```tsx
// src/components/documents/document-reader.tsx
export function buildAnnotationSegments(input: {
  blocks: Array<{ blockKey: string; text: string }>;
  annotations: Array<{
    id: string;
    startBlockKey: string;
    startOffset: number;
    endBlockKey: string;
    endOffset: number;
  }>;
}) {
  const result: Record<string, Array<{ annotationId: string; startOffset: number; endOffset: number }>> = {};
  const order = input.blocks.map((block) => block.blockKey);

  for (const annotation of input.annotations) {
    const startIndex = order.indexOf(annotation.startBlockKey);
    const endIndex = order.indexOf(annotation.endBlockKey);
    for (let index = startIndex; index <= endIndex; index += 1) {
      const block = input.blocks[index];
      const startOffset = index === startIndex ? annotation.startOffset : 0;
      const endOffset = index === endIndex ? annotation.endOffset : block.text.length;
      result[block.blockKey] ??= [];
      result[block.blockKey].push({
        annotationId: annotation.id,
        startOffset,
        endOffset,
      });
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- tests/unit/annotations/build-annotation-segments.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents/get-owner-document.ts src/components/documents/document-reader.tsx src/components/documents/annotation-panel.tsx src/lib/annotations/create-annotation.ts src/lib/annotations/update-annotation.ts src/lib/annotations/delete-annotation.ts src/app/'(app)'/documents/[documentId]/page.tsx tests/unit/annotations/build-annotation-segments.test.ts
git commit -m "feat: add owner reader and annotation crud"
```

### Task 7: Implement Built-In List Toggles And Highlight Recompute

**Files:**
- Create: `src/lib/highlights/recompute-document-highlights.ts`
- Create: `src/components/documents/list-toggle-form.tsx`
- Modify: `src/app/(app)/documents/[documentId]/page.tsx`
- Test: `tests/unit/highlights/recompute-document-highlights.test.ts`

- [ ] **Step 1: Write the failing recompute test**

```ts
import { describe, expect, it, vi } from "vitest";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";

describe("recomputeDocumentHighlights", () => {
  it("replaces persisted matches when active lists change", async () => {
    const prisma = {
      document: { findUniqueOrThrow: vi.fn(async () => ({ blocks: [{ blockKey: "paragraph:0", text: "alpha beta" }] })) },
      highlightMatch: { deleteMany: vi.fn(async () => undefined), createMany: vi.fn(async () => undefined) },
    } as never;

    await recomputeDocumentHighlights({
      prisma,
      documentId: "doc_1",
      activeTerms: new Set(["beta"]),
      excludedTerms: new Set(),
    });

    expect(prisma.highlightMatch.deleteMany).toHaveBeenCalledWith({ where: { documentId: "doc_1" } });
    expect(prisma.highlightMatch.createMany).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/highlights/recompute-document-highlights.test.ts`
Expected: FAIL because the recompute service does not exist.

- [ ] **Step 3: Implement recompute logic and owner toggle UI**

```ts
// src/lib/highlights/recompute-document-highlights.ts
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";

export async function recomputeDocumentHighlights(input: {
  prisma: typeof import("@/lib/db").prisma;
  documentId: string;
  activeTerms: Set<string>;
  excludedTerms: Set<string>;
}) {
  const document = await input.prisma.document.findUniqueOrThrow({
    where: { id: input.documentId },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });

  const matches = computeHighlightMatches({
    blocks: document.blocks,
    activeTerms: input.activeTerms,
    excludedTerms: input.excludedTerms,
  });

  await input.prisma.$transaction([
    input.prisma.highlightMatch.deleteMany({ where: { documentId: input.documentId } }),
    input.prisma.highlightMatch.createMany({
      data: matches.map((match) => ({ ...match, documentId: input.documentId })),
    }),
  ]);
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- tests/unit/highlights/recompute-document-highlights.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/highlights/recompute-document-highlights.ts src/components/documents/list-toggle-form.tsx src/app/'(app)'/documents/[documentId]/page.tsx tests/unit/highlights/recompute-document-highlights.test.ts
git commit -m "feat: add built-in list toggles and highlight recompute"
```

### Task 8: Implement Authenticated Share Links And The Read-Only Shared View

**Files:**
- Create: `src/lib/documents/get-shared-document.ts`
- Create: `src/lib/shares/enable-document-share.ts`
- Create: `src/lib/shares/revoke-document-share.ts`
- Create: `src/components/documents/share-panel.tsx`
- Create: `src/app/shared/[token]/page.tsx`
- Test: `tests/unit/shares/get-shared-document.test.ts`

- [ ] **Step 1: Write the failing shared-access test**

```ts
import { describe, expect, it, vi } from "vitest";
import { getSharedDocument } from "@/lib/documents/get-shared-document";

describe("getSharedDocument", () => {
  it("rejects revoked share tokens", async () => {
    const prisma = {
      documentShare: {
        findUnique: vi.fn(async () => ({ token: "dead", isActive: false })),
      },
    } as never;

    await expect(getSharedDocument({ prisma, token: "dead" })).rejects.toThrow("SHARE_NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/shares/get-shared-document.test.ts`
Expected: FAIL because the shared-document service does not exist.

- [ ] **Step 3: Implement share enable, revoke, and shared read model**

```ts
// src/lib/documents/get-shared-document.ts
export async function getSharedDocument(input: {
  prisma: typeof import("@/lib/db").prisma;
  token: string;
}) {
  const share = await input.prisma.documentShare.findUnique({
    where: { token: input.token },
    include: {
      document: {
        include: {
          blocks: { orderBy: { sortOrder: "asc" } },
          highlightMatches: true,
          annotations: true,
        },
      },
    },
  });

  if (!share || !share.isActive) {
    throw new Error("SHARE_NOT_FOUND");
  }

  return share.document;
}
```

```ts
// src/lib/shares/enable-document-share.ts
import { randomBytes } from "node:crypto";

export async function enableDocumentShare(input: {
  prisma: typeof import("@/lib/db").prisma;
  documentId: string;
}) {
  return input.prisma.documentShare.upsert({
    where: { documentId: input.documentId },
    update: {
      token: randomBytes(24).toString("hex"),
      isActive: true,
    },
    create: {
      documentId: input.documentId,
      token: randomBytes(24).toString("hex"),
      isActive: true,
    },
  });
}
```

```tsx
// src/app/shared/[token]/page.tsx
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSharedDocument } from "@/lib/documents/get-shared-document";
import { DocumentReader } from "@/components/documents/document-reader";

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  try {
    await getRequiredSession();
  } catch {
    redirect("/sign-in");
  }

  const { token } = await params;
  const document = await getSharedDocument({ prisma, token });

  return (
    <main>
      <h1>Read-only shared view</h1>
      <DocumentReader
        blocks={document.blocks}
        highlights={document.highlightMatches}
        annotations={document.annotations}
        editable={false}
      />
    </main>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- tests/unit/shares/get-shared-document.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents/get-shared-document.ts src/lib/shares/enable-document-share.ts src/lib/shares/revoke-document-share.ts src/components/documents/share-panel.tsx src/app/shared/[token]/page.tsx tests/unit/shares/get-shared-document.test.ts
git commit -m "feat: add authenticated share links and shared reader"
```

### Task 9: Add End-To-End Coverage And Operational Verification

**Files:**
- Create: `tests/e2e/owner-upload-and-share.spec.ts`
- Create: `docs/operations/google-auth-smoke-checklist.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing end-to-end test**

```ts
import { expect, test } from "@playwright/test";

test("owner uploads a document and a shared viewer can read it", async ({ browser }) => {
  const owner = await browser.newContext({ storageState: "tests/e2e/storage/owner.json" });
  const ownerPage = await owner.newPage();

  await ownerPage.goto("/documents/new");
  await ownerPage.getByLabel("Markdown file").setInputFiles("tests/fixtures/sample.md");
  await ownerPage.getByRole("button", { name: "Upload document" }).click();
  await expect(ownerPage.getByText("alpha beta gamma")).toBeVisible();

  await ownerPage.getByRole("button", { name: "Enable share link" }).click();
  const shareLink = await ownerPage.getByLabel("Share link").inputValue();

  const viewer = await browser.newContext({ storageState: "tests/e2e/storage/viewer.json" });
  const viewerPage = await viewer.newPage();
  await viewerPage.goto(shareLink);

  await expect(viewerPage.getByText("alpha beta gamma")).toBeVisible();
  await expect(viewerPage.getByText("Read-only shared view")).toBeVisible();
  await expect(viewerPage.getByRole("button", { name: "Save annotation" })).toHaveCount(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/owner-upload-and-share.spec.ts`
Expected: FAIL because the upload, share, and reader flows are not fully wired together yet.

- [ ] **Step 3: Finish test fixtures, docs, and the Google-auth smoke checklist**

```md
<!-- docs/operations/google-auth-smoke-checklist.md -->
# Google Auth Smoke Checklist

1. Start the app with valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. Open `/sign-in`.
3. Click `Continue with Google`.
4. Complete OAuth with the development test account.
5. Confirm redirect to `/documents`.
6. Sign out.
7. Open a shared link while signed out and confirm redirect to `/sign-in`.
8. Sign back in with a different Google account and confirm the shared document loads in read-only mode.
```

```md
<!-- README.md -->
## Local Development

1. `npm install`
2. Copy `.env.example` to `.env.local`
3. `npm run db:migrate`
4. `npm run db:seed`
5. `npm run dev`
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm run test && npm run test:e2e`
Expected: PASS for automated suites.

Then execute the manual checklist in `docs/operations/google-auth-smoke-checklist.md`.
Expected: real Google sign-in and authenticated shared viewing both work.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/owner-upload-and-share.spec.ts docs/operations/google-auth-smoke-checklist.md README.md
git commit -m "test: add end-to-end coverage and auth smoke checklist"
```

## Acceptance Path

- Owner can sign in with Google and reach the protected documents area.
- Owner can upload a Markdown file and see it parsed into readable blocks.
- Owner can enable built-in lists and see persisted highlights after exclusions are applied.
- Owner can create, edit, and delete annotations that survive reloads.
- Shared viewer must sign in with Google before seeing a shared document.
- Shared viewer sees the owner’s highlights and annotations but no editing controls.
- Revoking the share link blocks future access.

## Risks To Watch During Execution

- Markdown parsing may duplicate nested list or blockquote text if the parser walks both parent and child nodes. Keep parser tests tight around block extraction.
- Annotation selection across blocks is the hardest UI behavior in scope. Keep the anchor model as block-key plus offsets and avoid DOM-derived IDs that can drift.
- Google OAuth is correct for production behavior but awkward in CI. Keep automated end-to-end tests session-seeded and use the manual smoke checklist for real OAuth.
- Full CET word-list source files are external content, not generated app code. Lock them into `vendor/word-lists/` before seeding to avoid drift across environments.
