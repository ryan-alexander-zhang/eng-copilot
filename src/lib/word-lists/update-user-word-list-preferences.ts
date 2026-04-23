import { WordListKind, type Prisma, type PrismaClient } from "@prisma/client";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";
import { BUILT_IN_EXCLUSION_SLUG, BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

type PreferencePrisma = Pick<
  PrismaClient,
  "document" | "wordList" | "userWordListPreference" | "$transaction"
>;

type RecomputeDocumentHighlightsFn = typeof recomputeDocumentHighlights;

type UpdateUserWordListPreferencesInput = {
  ownerId: string;
  selectedWordListIds: string[];
  prisma: PreferencePrisma;
  recomputeHighlights?: RecomputeDocumentHighlightsFn;
};

export async function updateUserWordListPreferences(
  input: UpdateUserWordListPreferencesInput,
) {
  const selectableBuiltInLists = await input.prisma.wordList.findMany({
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
  });
  const selectableWordListIds = new Set(selectableBuiltInLists.map((wordList) => wordList.id));

  if (input.selectedWordListIds.some((wordListId) => !selectableWordListIds.has(wordListId))) {
    throw new Error("Invalid word list selection");
  }

  const exclusionList = await input.prisma.wordList.findUnique({
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
  });

  if (!exclusionList) {
    throw new Error("Built-in exclusion list not found");
  }

  const ownedDocuments = await input.prisma.document.findMany({
    where: {
      ownerId: input.ownerId,
    },
    select: {
      id: true,
    },
  });
  const selectedWordListIdSet = new Set(input.selectedWordListIds);
  const activeTerms = new Set(
    selectableBuiltInLists.flatMap((wordList) =>
      selectedWordListIdSet.has(wordList.id)
        ? wordList.entries.map((entry) => entry.term)
        : [],
    ),
  );
  const excludedTerms = new Set(exclusionList.entries.map((entry) => entry.term));
  const recomputeHighlights = input.recomputeHighlights ?? recomputeDocumentHighlights;

  await input.prisma.$transaction(async (tx) => {
    await tx.userWordListPreference.deleteMany({
      where: {
        userId: input.ownerId,
      },
    });

    if (input.selectedWordListIds.length > 0) {
      await tx.userWordListPreference.createMany({
        data: input.selectedWordListIds.map((wordListId) => ({
          userId: input.ownerId,
          wordListId,
        })),
        skipDuplicates: true,
      });
    }

    const ownedDocumentIds = ownedDocuments.map((document) => document.id);

    if (ownedDocumentIds.length > 0) {
      await tx.documentWordList.deleteMany({
        where: {
          documentId: {
            in: ownedDocumentIds,
          },
        },
      });

      if (input.selectedWordListIds.length > 0) {
        await tx.documentWordList.createMany({
          data: ownedDocumentIds.flatMap((documentId) =>
            input.selectedWordListIds.map((wordListId) => ({
              documentId,
              wordListId,
            })),
          ),
          skipDuplicates: true,
        });
      }

      for (const documentId of ownedDocumentIds) {
        await recomputeHighlights({
          documentId,
          activeTerms,
          excludedTerms,
          prisma: tx as PreferenceTransactionPrisma,
        });
      }
    }
  });
}

type PreferenceTransactionPrisma = Pick<
  Prisma.TransactionClient,
  "document" | "documentWordList" | "highlightMatch" | "userWordListPreference"
>;
