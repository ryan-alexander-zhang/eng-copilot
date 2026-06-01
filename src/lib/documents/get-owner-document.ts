import type { PrismaClient } from "@prisma/client";
import type { ProjectionBlock } from "@/lib/markdown/types";

type GetOwnerDocumentInput = {
  documentId: string;
  ownerId: string;
  prisma: Pick<PrismaClient, "document">;
};

export async function getOwnerDocument(input: GetOwnerDocumentInput) {
  const document = await input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
      sourceFormat: "MARKDOWN",
      trashedAt: null,
    },
    select: {
      id: true,
      title: true,
      originalName: true,
      sourceUrl: true,
      rawMarkdown: true,
      plainText: true,
      sourceByteSize: true,
      createdAt: true,
      updatedAt: true,
      share: {
        select: {
          token: true,
          isActive: true,
        },
      },
      activeLists: {
        select: {
          wordList: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      },
      blocks: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          blockKey: true,
          blockPath: true,
          sortOrder: true,
          kind: true,
          selectable: true,
          attrs: true,
          text: true,
        },
      },
      highlightMatches: {
        orderBy: [{ blockKey: "asc" }, { startOffset: "asc" }],
        select: {
          id: true,
          blockKey: true,
          startOffset: true,
          endOffset: true,
          term: true,
        },
      },
      annotations: {
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          startBlockKey: true,
          startOffset: true,
          endBlockKey: true,
          endOffset: true,
          quote: true,
          note: true,
          tags: true,
          color: true,
          anchorData: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!document) {
    return null;
  }

  return {
    ...document,
    blocks: document.blocks.map((block) => ({
      ...block,
      kind: block.kind as ProjectionBlock["kind"],
      attrs: (block.attrs as ProjectionBlock["attrs"] | null) ?? null,
    })),
  };
}
