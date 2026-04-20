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
    },
    select: {
      id: true,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return input.prisma.documentShare.updateMany({
    where: {
      documentId: input.documentId,
    },
    data: {
      isActive: false,
    },
  });
}
