import { Prisma, type PrismaClient } from "@prisma/client";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";
import { parseMarkdownToRenderProjection } from "@/lib/markdown/parse-markdown-to-render-projection";

type MarkdownDocumentPrisma = Pick<PrismaClient, "document"> &
  Partial<Pick<PrismaClient, "wordList" | "userWordListPreference" | "vocabularyEntry">>;

type CreateMarkdownDocumentInput = {
  ownerId: string;
  title: string;
  originalName: string;
  rawMarkdown: string;
  sourceByteSize: number;
  sourceUrl?: string | null;
  prisma: MarkdownDocumentPrisma;
};

export async function createMarkdownDocument(input: CreateMarkdownDocumentInput) {
  const blocks = parseMarkdownToRenderProjection(input.rawMarkdown);
  const { activeTerms, excludedTerms, selectedWordListIds } = await getOwnerWordListSelection({
    ownerId: input.ownerId,
    prisma: input.prisma,
  });
  const highlightMatches = computeHighlightMatches({
    blocks,
    activeTerms,
    excludedTerms,
  });

  return input.prisma.document.create({
    data: {
      ownerId: input.ownerId,
      title: input.title,
      originalName: input.originalName,
      sourceUrl: input.sourceUrl ?? null,
      sourceFormat: "MARKDOWN",
      rawMarkdown: input.rawMarkdown,
      plainText: blocks.map((block) => block.text).join("\n\n"),
      sourceByteSize: input.sourceByteSize,
      pdfData: null,
      renderProjectionVersion: 2,
      ...(blocks.length > 0
        ? {
            blocks: {
              create: blocks.map((block) => ({
                blockKey: block.blockKey,
                blockPath: block.blockPath,
                sortOrder: block.sortOrder,
                kind: block.kind,
                selectable: block.selectable,
                attrs: block.attrs ?? Prisma.JsonNull,
                text: block.text,
              })),
            },
          }
        : {}),
      ...(selectedWordListIds.length > 0
        ? {
            activeLists: {
              create: selectedWordListIds.map((wordListId) => ({
                wordListId,
              })),
            },
          }
        : {}),
      ...(highlightMatches.length > 0
        ? {
            highlightMatches: {
              create: highlightMatches.map((match) => ({
                blockKey: match.blockKey,
                startOffset: match.startOffset,
                endOffset: match.endOffset,
                term: match.term,
              })),
            },
          }
        : {}),
    },
  });
}

async function getOwnerWordListSelection(input: {
  ownerId: string;
  prisma: MarkdownDocumentPrisma;
}) {
  if (!("userWordListPreference" in input.prisma) || !("wordList" in input.prisma)) {
    return {
      selectedWordListIds: [],
      activeTerms: new Set<string>(),
      excludedTerms: new Set<string>(),
    };
  }

  return getOwnerActiveTerms({
    ownerId: input.ownerId,
    prisma: input.prisma as Pick<PrismaClient, "wordList" | "userWordListPreference"> &
      Partial<Pick<PrismaClient, "vocabularyEntry">>,
  });
}
