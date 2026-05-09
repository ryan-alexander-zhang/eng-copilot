import { WordListKind, type PrismaClient } from "@prisma/client";
import { BUILT_IN_EXCLUSION_SLUG, BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

type OwnerActiveTermsPrisma = Pick<PrismaClient, "wordList"> &
  Partial<Pick<PrismaClient, "userWordListPreference" | "vocabularyEntry">>;

export async function getOwnerActiveTerms(input: {
  ownerId: string;
  prisma: OwnerActiveTermsPrisma;
  selectedWordListIds?: string[];
}) {
  const [selectableBuiltInLists, exclusionList, preferredLists] = await Promise.all([
    input.prisma.wordList.findMany({
      where: {
        kind: WordListKind.POSITIVE,
        slug: {
          in: BUILT_IN_LISTS.map((list) => list.slug),
        },
      },
      select: {
        id: true,
        entries: {
          select: {
            term: true,
          },
        },
      },
    }),
    input.prisma.wordList.findUnique({
      where: {
        slug: BUILT_IN_EXCLUSION_SLUG,
      },
      select: {
        entries: {
          select: {
            term: true,
          },
        },
      },
    }),
    input.selectedWordListIds || !input.prisma.userWordListPreference
      ? Promise.resolve([])
      : input.prisma.userWordListPreference.findMany({
          where: {
            userId: input.ownerId,
          },
          select: {
            wordListId: true,
          },
        }),
  ]);

  if (!exclusionList) {
    throw new Error("Built-in exclusion list not found");
  }

  const selectableWordListIds = new Set(selectableBuiltInLists.map((wordList) => wordList.id));
  const requestedWordListIds =
    input.selectedWordListIds ?? preferredLists.map((list) => list.wordListId);

  if (input.selectedWordListIds?.some((wordListId) => !selectableWordListIds.has(wordListId))) {
    throw new Error("Invalid word list selection");
  }

  const selectedWordListIds = requestedWordListIds.filter((wordListId) =>
    selectableWordListIds.has(wordListId),
  );
  const selectedWordListIdSet = new Set(selectedWordListIds);
  const vocabularyEntries =
    selectedWordListIds.length > 0 && input.prisma.vocabularyEntry
      ? await input.prisma.vocabularyEntry.findMany({
          where: {
            ownerId: input.ownerId,
            wordLists: {
              some: {
                wordListId: {
                  in: selectedWordListIds,
                },
              },
            },
          },
          select: {
            word: true,
          },
        })
      : [];

  return {
    selectedWordListIds,
    activeTerms: new Set([
      ...selectableBuiltInLists.flatMap((wordList) =>
        selectedWordListIdSet.has(wordList.id)
          ? wordList.entries.map((entry) => entry.term)
          : [],
      ),
      ...vocabularyEntries.map((entry) => entry.word),
    ]),
    excludedTerms: new Set(exclusionList.entries.map((entry) => entry.term)),
  };
}
