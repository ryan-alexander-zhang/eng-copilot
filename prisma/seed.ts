import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient, WordListKind } from "@prisma/client";
import {
  BUILT_IN_EXCLUSION_SLUG,
  BUILT_IN_LISTS,
} from "@/lib/word-lists/catalog";

const prisma = new PrismaClient();

async function loadTerms(fileName: string) {
  const raw = await readFile(
    join(process.cwd(), "vendor/word-lists", fileName),
    "utf8",
  );

  return raw
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}

async function seedWordList(input: {
  slug: string;
  name: string;
  kind: WordListKind;
  fileName: string;
}) {
  const terms = await loadTerms(input.fileName);
  const wordList = await prisma.wordList.upsert({
    where: { slug: input.slug },
    update: { name: input.name, kind: input.kind },
    create: {
      slug: input.slug,
      name: input.name,
      kind: input.kind,
    },
  });

  await prisma.wordListEntry.deleteMany({
    where: { wordListId: wordList.id },
  });

  if (terms.length > 0) {
    await prisma.wordListEntry.createMany({
      data: terms.map((term) => ({
        wordListId: wordList.id,
        term,
      })),
      skipDuplicates: true,
    });
  }
}

async function main() {
  for (const list of BUILT_IN_LISTS) {
    await seedWordList({
      ...list,
      kind: WordListKind.POSITIVE,
      fileName: `${list.slug}.txt`,
    });
  }

  await seedWordList({
    slug: BUILT_IN_EXCLUSION_SLUG,
    name: "Built-in Exclusions",
    kind: WordListKind.EXCLUSION,
    fileName: "exclusion.txt",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
