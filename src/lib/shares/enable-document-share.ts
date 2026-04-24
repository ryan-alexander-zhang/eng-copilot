import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

type EnableDocumentShareInput = {
  documentId: string;
  ownerId: string;
  prisma: Pick<PrismaClient, "document" | "documentShare">;
};

export async function enableDocumentShare(input: EnableDocumentShareInput) {
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

  const token = randomBytes(24).toString("hex");

  return input.prisma.documentShare.upsert({
    where: {
      documentId: input.documentId,
    },
    update: {
      token,
      isActive: true,
    },
    create: {
      documentId: input.documentId,
      token,
      isActive: true,
    },
  });
}
