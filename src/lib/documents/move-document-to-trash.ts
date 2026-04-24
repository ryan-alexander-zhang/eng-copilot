import type { PrismaClient } from "@prisma/client";

type MoveDocumentToTrashInput = {
  documentId: string;
  ownerId: string;
  prisma: Pick<PrismaClient, "document">;
};

export async function moveDocumentToTrash(input: MoveDocumentToTrashInput) {
  const document = await input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
      trashedAt: null,
    },
    select: {
      id: true,
      share: {
        select: {
          token: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await input.prisma.document.update({
    where: {
      id: input.documentId,
    },
    data: {
      trashedAt: new Date(),
    },
  });

  return {
    id: document.id,
    shareToken: document.share?.token ?? null,
  };
}
