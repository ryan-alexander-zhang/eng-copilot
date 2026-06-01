import type { PrismaClient } from "@prisma/client";
import type { ProjectionBlock } from "@/lib/markdown/types";

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
          sourceFormat: true,
          rawMarkdown: true,
          plainText: true,
          sourceByteSize: true,
          trashedAt: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
          activeLists: {
            select: {
              wordList: {
                select: {
                  entries: {
                    select: {
                      term: true,
                    },
                  },
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
      },
    },
  });

  if (!share || !share.isActive) {
    throw new Error("SHARE_NOT_FOUND");
  }

  if (share.document.trashedAt) {
    throw new Error("SHARE_NOT_FOUND");
  }

  if (share.document.sourceFormat !== "MARKDOWN") {
    throw new Error("SHARE_NOT_FOUND");
  }

  const { sourceFormat, trashedAt, ...document } = share.document;
  void sourceFormat;
  void trashedAt;

  return {
    ...document,
    blocks: document.blocks.map((block) => ({
      ...block,
      kind: block.kind as ProjectionBlock["kind"],
      attrs: (block.attrs as ProjectionBlock["attrs"] | null) ?? null,
    })),
  };
}
