import type { PrismaClient } from "@prisma/client";

type GetSharedDocumentInput = {
  token: string;
  prisma: Pick<PrismaClient, "documentShare">;
};

export async function getSharedDocument(input: GetSharedDocumentInput) {
  const share = await input.prisma.documentShare.findUnique({
    where: {
      token: input.token,
    },
    select: {
      isActive: true,
      document: {
        select: {
          id: true,
          title: true,
          originalName: true,
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
      },
    },
  });

  if (!share || !share.isActive) {
    throw new Error("SHARE_NOT_FOUND");
  }

  return share.document;
}
