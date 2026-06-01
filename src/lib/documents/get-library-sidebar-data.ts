import type { PrismaClient } from "@prisma/client";
import { formatStorageAmount } from "@/lib/documents/metrics";

const STORAGE_TOTAL_BYTES = 10 * 1024 * 1024 * 1024;

type GetLibrarySidebarDataInput = {
  ownerId: string;
  prisma: Pick<PrismaClient, "document" | "documentShare">;
};

export async function getLibrarySidebarData(input: GetLibrarySidebarDataInput) {
  const [activeDocuments, sharedWithMeCount, readOnlyLinksCount, trashCount] = await Promise.all([
    input.prisma.document.findMany({
      where: {
        ownerId: input.ownerId,
        sourceFormat: "MARKDOWN",
        trashedAt: null,
      },
      select: {
        sourceByteSize: true,
      },
    }),
    input.prisma.documentShare.count({
      where: {
        isActive: true,
        document: {
          ownerId: {
            not: input.ownerId,
          },
          sourceFormat: "MARKDOWN",
          trashedAt: null,
        },
      },
    }),
    input.prisma.documentShare.count({
      where: {
        isActive: true,
        document: {
          ownerId: input.ownerId,
          sourceFormat: "MARKDOWN",
          trashedAt: null,
        },
      },
    }),
    input.prisma.document.count({
      where: {
        ownerId: input.ownerId,
        sourceFormat: "MARKDOWN",
        trashedAt: {
          not: null,
        },
      },
    }),
  ]);

  const storageBytes = activeDocuments.reduce(
    (sum, document) => sum + document.sourceByteSize,
    0,
  );

  return {
    counts: {
      documents: activeDocuments.length,
      readOnlyLinks: readOnlyLinksCount,
      sharedWithMe: sharedWithMeCount,
      trash: trashCount,
    },
    storage: {
      progress: storageBytes / STORAGE_TOTAL_BYTES,
      totalLabel: "10 GB",
      usedLabel: formatStorageAmount(storageBytes),
    },
  };
}
