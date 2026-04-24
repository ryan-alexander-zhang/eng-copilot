import type { PrismaClient } from "@prisma/client";

type GetOwnerDocumentInput = {
  documentId: string;
  ownerId: string;
  prisma: Pick<PrismaClient, "document">;
};

export async function getOwnerDocument(input: GetOwnerDocumentInput) {
  return input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
      trashedAt: null,
    },
    select: {
      id: true,
      title: true,
      originalName: true,
      rawMarkdown: true,
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
          sortOrder: true,
          kind: true,
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
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}
