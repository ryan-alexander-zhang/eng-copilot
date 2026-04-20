import { WordListKind, type Prisma, type PrismaClient } from "@prisma/client";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";
import { BUILT_IN_EXCLUSION_SLUG, BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

type HighlightListPrisma = Pick<PrismaClient, "document" | "wordList" | "$transaction">;

type RecomputeDocumentHighlightsFn = typeof recomputeDocumentHighlights;

type UpdateDocumentHighlightListsInput = {
  documentId: string;
  ownerId: string;
  selectedWordListIds: string[];
  prisma: HighlightListPrisma;
  recomputeHighlights?: RecomputeDocumentHighlightsFn;
};

export async function updateDocumentHighlightLists(input: UpdateDocumentHighlightListsInput) {
  const ownedDocument = await input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!ownedDocument) {
    throw new Error("Document not found");
  }

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
    await tx.documentWordList.deleteMany({
      where: {
        documentId: input.documentId,
      },
    });

    if (input.selectedWordListIds.length > 0) {
      await tx.documentWordList.createMany({
        data: input.selectedWordListIds.map((wordListId) => ({
          documentId: input.documentId,
          wordListId,
        })),
        skipDuplicates: true,
      });
    }

    await recomputeHighlights({
      documentId: input.documentId,
      activeTerms,
      excludedTerms,
      prisma: tx as HighlightTransactionPrisma,
    });
  });
}

type HighlightTransactionPrisma = Pick<
  Prisma.TransactionClient,
  "document" | "documentWordList" | "highlightMatch"
>;
