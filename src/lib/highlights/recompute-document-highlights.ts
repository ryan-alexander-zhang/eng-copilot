import type { Prisma, PrismaClient } from "@prisma/client";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";
import type { ParsedBlock } from "@/lib/markdown/parse-markdown-to-blocks";

type HighlightPrisma = Pick<PrismaClient, "document" | "highlightMatch"> | Pick<
  Prisma.TransactionClient,
  "document" | "highlightMatch"
>;

type RecomputeDocumentHighlightsInput = {
  documentId: string;
  activeTerms: Set<string>;
  excludedTerms: Set<string>;
  prisma: HighlightPrisma;
};

export async function recomputeDocumentHighlights(input: RecomputeDocumentHighlightsInput) {
  const document = await input.prisma.document.findUnique({
    where: {
      id: input.documentId,
    },
    select: {
      blocks: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          blockKey: true,
          kind: true,
          sortOrder: true,
          text: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const highlightMatches = computeHighlightMatches({
    blocks: document.blocks.map((block) => ({
      ...block,
      kind: block.kind as ParsedBlock["kind"],
    })),
    activeTerms: input.activeTerms,
    excludedTerms: input.excludedTerms,
  });

  await input.prisma.highlightMatch.deleteMany({
    where: {
      documentId: input.documentId,
    },
  });

  if (highlightMatches.length === 0) {
    return;
  }

  await input.prisma.highlightMatch.createMany({
    data: highlightMatches.map((match) => ({
      documentId: input.documentId,
      blockKey: match.blockKey,
      startOffset: match.startOffset,
      endOffset: match.endOffset,
      term: match.term,
    })),
  });
}
