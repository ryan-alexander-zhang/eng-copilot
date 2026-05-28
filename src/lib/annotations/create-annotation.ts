import { Prisma, type PrismaClient } from "@prisma/client";
import type { PdfAnnotationAnchor } from "@/lib/markdown/types";

type CreateAnnotationInput = {
  documentId: string;
  ownerId: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
  note: string;
  tags?: string[];
  color?: string;
  anchorData?: PdfAnnotationAnchor | null;
  prisma: Pick<PrismaClient, "annotation" | "document">;
};

export async function createAnnotation(input: CreateAnnotationInput) {
  const document = await input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
    },
    select: {
      sourceFormat: true,
      blocks: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          blockKey: true,
          text: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const quote = buildAnnotationQuote({
    blocks: document.blocks,
    startBlockKey: input.startBlockKey,
    startOffset: input.startOffset,
    endBlockKey: input.endBlockKey,
    endOffset: input.endOffset,
  });
  const anchorData = normalizeAnchorData({
    anchorData: input.anchorData,
    sourceFormat: document.sourceFormat,
  });

  return input.prisma.annotation.create({
    data: {
      documentId: input.documentId,
      ownerId: input.ownerId,
      startBlockKey: input.startBlockKey,
      startOffset: input.startOffset,
      endBlockKey: input.endBlockKey,
      endOffset: input.endOffset,
      quote,
      note: input.note.trim(),
      tags: normalizeTags(input.tags),
      color: input.color?.trim() || "yellow",
      anchorData: anchorData ?? Prisma.JsonNull,
    },
  });
}

function buildAnnotationQuote(input: {
  blocks: Array<{ blockKey: string; text: string }>;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
}) {
  const blockIndexByKey = new Map(
    input.blocks.map((block, index) => [block.blockKey, index] as const),
  );
  const startIndex = blockIndexByKey.get(input.startBlockKey);
  const endIndex = blockIndexByKey.get(input.endBlockKey);

  if (startIndex === undefined || endIndex === undefined || startIndex > endIndex) {
    throw new Error("Invalid annotation range");
  }

  const startBlock = input.blocks[startIndex];
  const endBlock = input.blocks[endIndex];

  if (!isValidOffset(input.startOffset, startBlock.text.length)) {
    throw new Error("Invalid annotation start offset");
  }

  if (!isValidOffset(input.endOffset, endBlock.text.length)) {
    throw new Error("Invalid annotation end offset");
  }

  if (startIndex === endIndex) {
    const quote = startBlock.text.slice(input.startOffset, input.endOffset);

    if (quote.length === 0) {
      throw new Error("Annotation quote cannot be empty");
    }

    return quote;
  }

  const parts = input.blocks.slice(startIndex, endIndex + 1).map((block, index, blocks) => {
    if (index === 0) {
      return block.text.slice(input.startOffset);
    }

    if (index === blocks.length - 1) {
      return block.text.slice(0, input.endOffset);
    }

    return block.text;
  });
  const selectedCharacterCount = parts.reduce((count, part) => count + part.length, 0);

  if (selectedCharacterCount === 0) {
    throw new Error("Annotation quote cannot be empty");
  }

  const quote = parts.join("\n");

  return quote;
}

function isValidOffset(offset: number, textLength: number) {
  return Number.isInteger(offset) && offset >= 0 && offset <= textLength;
}

function normalizeTags(tags?: string[]) {
  const uniqueTags = new Set<string>();

  for (const tag of tags ?? []) {
    const normalizedTag = tag.trim().toLowerCase();

    if (normalizedTag.length === 0) {
      continue;
    }

    uniqueTags.add(normalizedTag);
  }

  return [...uniqueTags];
}

function normalizeAnchorData(input: {
  anchorData?: PdfAnnotationAnchor | null;
  sourceFormat: "MARKDOWN" | "PDF";
}) {
  if (input.sourceFormat === "MARKDOWN") {
    return null;
  }

  if (!isPdfAnnotationAnchor(input.anchorData)) {
    throw new Error("Invalid PDF annotation anchor");
  }

  return input.anchorData;
}

function isPdfAnnotationAnchor(value: unknown): value is PdfAnnotationAnchor {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "pdf-page-text-v1" &&
    "startPageNumber" in value &&
    Number.isInteger(value.startPageNumber) &&
    "startRunIndex" in value &&
    Number.isInteger(value.startRunIndex) &&
    "endPageNumber" in value &&
    Number.isInteger(value.endPageNumber) &&
    "endRunIndex" in value &&
    Number.isInteger(value.endRunIndex) &&
    "rects" in value &&
    Array.isArray(value.rects)
  );
}
