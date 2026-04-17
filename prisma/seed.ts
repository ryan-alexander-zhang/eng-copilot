import { join } from "node:path";
import { Prisma, PrismaClient, WordListKind } from "@prisma/client";
import {
  BUILT_IN_EXCLUSION,
  BUILT_IN_LISTS,
} from "@/lib/word-lists/catalog";
import { loadWordListTerms } from "@/lib/word-lists/load-word-list-terms";

const prisma = new PrismaClient();

async function loadBuiltInWordLists() {
  const positiveLists = await Promise.all(
    BUILT_IN_LISTS.map(async (list) => ({
      ...list,
      kind: WordListKind.POSITIVE,
      terms: await loadWordListTerms(
        join(process.cwd(), "vendor/word-lists", list.fileName),
      ),
    })),
  );

  const exclusionList = {
    ...BUILT_IN_EXCLUSION,
    kind: WordListKind.EXCLUSION,
    terms: await loadWordListTerms(
      join(process.cwd(), "vendor/word-lists", BUILT_IN_EXCLUSION.fileName),
    ),
  };

  return [...positiveLists, exclusionList];
}

async function refreshWordList(
  tx: Prisma.TransactionClient,
  input: {
    slug: string;
    name: string;
    kind: WordListKind;
    terms: string[];
  },
) {
  const wordList = await tx.wordList.upsert({
    where: { slug: input.slug },
    update: { name: input.name, kind: input.kind },
    create: {
      slug: input.slug,
      name: input.name,
      kind: input.kind,
    },
  });

  await tx.wordListEntry.deleteMany({
    where: { wordListId: wordList.id },
  });

  if (input.terms.length > 0) {
    await tx.wordListEntry.createMany({
      data: input.terms.map((term) => ({
        wordListId: wordList.id,
        term,
      })),
      skipDuplicates: true,
    });
  }
}

async function main() {
  const builtInWordLists = await loadBuiltInWordLists();

  await prisma.$transaction(async (tx) => {
    for (const wordList of builtInWordLists) {
      await refreshWordList(tx, wordList);
    }
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
