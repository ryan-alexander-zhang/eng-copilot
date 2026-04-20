import type { PrismaClient } from "@prisma/client";

type CreateAnnotationInput = {
  documentId: string;
  ownerId: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
  note: string;
  prisma: Pick<PrismaClient, "annotation" | "document">;
};

export async function createAnnotation(input: CreateAnnotationInput) {
  const document = await input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
    },
    select: {
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
  const quote = parts.join("\n");

  if (quote.length === 0) {
    throw new Error("Annotation quote cannot be empty");
  }

  return quote;
}

function isValidOffset(offset: number, textLength: number) {
  return Number.isInteger(offset) && offset >= 0 && offset <= textLength;
}
