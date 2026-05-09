import { type Prisma, type PrismaClient } from "@prisma/client";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";

type HighlightListPrisma = Pick<PrismaClient, "document" | "wordList" | "$transaction"> &
  Partial<Pick<PrismaClient, "vocabularyEntry">>;

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

  const { activeTerms, excludedTerms } = await getOwnerActiveTerms({
    ownerId: input.ownerId,
    selectedWordListIds: input.selectedWordListIds,
    prisma: input.prisma,
  });
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
