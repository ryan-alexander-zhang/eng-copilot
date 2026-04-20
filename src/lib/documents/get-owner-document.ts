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
    },
    select: {
      id: true,
      title: true,
      originalName: true,
      createdAt: true,
      updatedAt: true,
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
          createdAt: "asc",
        },
        select: {
          id: true,
          startBlockKey: true,
          startOffset: true,
          endBlockKey: true,
          endOffset: true,
          quote: true,
          note: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}
