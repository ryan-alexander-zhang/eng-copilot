import { type Prisma, type PrismaClient } from "@prisma/client";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";

type PreferencePrisma = Pick<
  PrismaClient,
  "document" | "wordList" | "userWordListPreference" | "$transaction"
> &
  Partial<Pick<PrismaClient, "vocabularyEntry">>;

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
  const ownedDocuments = await input.prisma.document.findMany({
    where: {
      ownerId: input.ownerId,
      trashedAt: null,
    },
    select: {
      id: true,
    },
  });
  const { activeTerms, excludedTerms } = await getOwnerActiveTerms({
    ownerId: input.ownerId,
    selectedWordListIds: input.selectedWordListIds,
    prisma: input.prisma,
  });
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
