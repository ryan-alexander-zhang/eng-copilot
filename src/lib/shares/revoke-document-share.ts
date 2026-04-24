import type { PrismaClient } from "@prisma/client";

type RevokeDocumentShareInput = {
  documentId: string;
  ownerId: string;
  prisma: Pick<PrismaClient, "document" | "documentShare">;
};

export async function revokeDocumentShare(input: RevokeDocumentShareInput) {
  const document = await input.prisma.document.findFirst({
    where: {
      id: input.documentId,
      ownerId: input.ownerId,
      trashedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const share = await input.prisma.documentShare.findUnique({
    where: {
      documentId: input.documentId,
    },
    select: {
      token: true,
      isActive: true,
    },
  });

  if (!share) {
    return null;
  }

  return input.prisma.documentShare.update({
    where: {
      documentId: input.documentId,
    },
    data: {
      isActive: false,
    },
    select: {
      token: true,
      isActive: true,
    },
  });
}
