import { describe, expect, it, vi } from "vitest";
import { getSharedDocument } from "@/lib/documents/get-shared-document";

describe("getSharedDocument", () => {
  it("rejects missing share tokens", async () => {
    const prisma = {
      documentShare: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as never;

    await expect(getSharedDocument({ prisma, token: "missing" })).rejects.toThrow(
      "SHARE_NOT_FOUND",
    );
  });

  it("rejects revoked share tokens", async () => {
    const prisma = {
      documentShare: {
        findUnique: vi.fn(async () => ({ token: "dead", isActive: false })),
      },
    } as never;

    await expect(getSharedDocument({ prisma, token: "dead" })).rejects.toThrow(
      "SHARE_NOT_FOUND",
    );
  });

  it("returns the shared document for an active token", async () => {
    const sharedDocument = {
      id: "doc_123",
      title: "Shared doc",
      originalName: "shared.md",
      sourceFormat: "MARKDOWN",
      rawMarkdown: "alpha",
      plainText: "alpha",
      sourceByteSize: 5,
      trashedAt: null,
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      updatedAt: new Date("2026-04-17T00:00:00.000Z"),
      owner: {
        name: "Alex Chen",
        email: "alex@example.com",
      },
      activeLists: [
        {
          wordList: {
            id: "list_123",
            slug: "cet4",
            name: "CET4",
          },
        },
      ],
      blocks: [
        {
          blockKey: "paragraph:0",
          blockPath: "0:paragraph",
          sortOrder: 0,
          kind: "paragraph",
          selectable: true,
          attrs: null,
          text: "alpha",
        },
      ],
      highlightMatches: [
        {
          id: "match_123",
          blockKey: "paragraph:0",
          startOffset: 0,
          endOffset: 5,
          term: "alpha",
        },
      ],
      annotations: [
        {
          id: "annotation_123",
          startBlockKey: "paragraph:0",
          startOffset: 0,
          endBlockKey: "paragraph:0",
          endOffset: 5,
          quote: "alpha",
          note: "note",
          tags: [],
          color: "yellow",
          anchorData: null,
          createdAt: new Date("2026-04-17T00:00:00.000Z"),
          updatedAt: new Date("2026-04-17T00:00:00.000Z"),
        },
      ],
    };
    const findUnique = vi.fn().mockResolvedValue({
      token: "live",
      isActive: true,
      document: sharedDocument,
    });

    const result = await getSharedDocument({
      prisma: {
        documentShare: {
          findUnique,
        },
      } as never,
      token: "live",
    });

    const { sourceFormat, trashedAt, ...expectedDocument } = sharedDocument;

    expect(sourceFormat).toBe("MARKDOWN");
    expect(trashedAt).toBeNull();
    expect(result).toEqual(expectedDocument);
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        token: "live",
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
  });

  it("rejects trashed shared documents", async () => {
    const prisma = {
      documentShare: {
        findUnique: vi.fn().mockResolvedValue({
          isActive: true,
          document: {
            trashedAt: new Date("2026-04-20T00:00:00.000Z"),
          },
        }),
      },
    } as never;

    await expect(getSharedDocument({ prisma, token: "live" })).rejects.toThrow(
      "SHARE_NOT_FOUND",
    );
  });

  it("rejects shared documents that are not markdown", async () => {
    const prisma = {
      documentShare: {
        findUnique: vi.fn().mockResolvedValue({
          isActive: true,
          document: {
            sourceFormat: "PDF",
            trashedAt: null,
          },
        }),
      },
    } as never;

    await expect(getSharedDocument({ prisma, token: "live" })).rejects.toThrow(
      "SHARE_NOT_FOUND",
    );
  });
});
