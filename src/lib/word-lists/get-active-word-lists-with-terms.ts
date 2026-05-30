import type { PrismaClient } from "@prisma/client";

type ActiveWordListsPrisma = Pick<PrismaClient, "wordList">;

export async function getActiveWordListsWithTerms(input: {
  ownerId: string;
  prisma: ActiveWordListsPrisma;
  wordListIds: string[];
}) {
  if (input.wordListIds.length === 0) {
    return [];
  }

  const wordLists = await input.prisma.wordList.findMany({
    where: {
      id: {
        in: input.wordListIds,
      },
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      entries: {
        select: {
          term: true,
        },
      },
      vocabularyEntries: {
        where: {
          vocabularyEntry: {
            ownerId: input.ownerId,
          },
        },
        select: {
          vocabularyEntry: {
            select: {
              word: true,
            },
          },
        },
      },
    },
  });

  return wordLists.map((wordList) => ({
    id: wordList.id,
    name: wordList.name,
    entries:
      wordList.ownerId === input.ownerId
        ? wordList.vocabularyEntries.map((entry) => ({
            term: entry.vocabularyEntry.word,
          }))
        : wordList.entries,
  }));
}
