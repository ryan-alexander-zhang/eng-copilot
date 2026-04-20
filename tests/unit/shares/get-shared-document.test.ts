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
      blocks: [{ blockKey: "paragraph:0", sortOrder: 0, kind: "paragraph", text: "alpha" }],
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

    expect(result).toEqual(sharedDocument);
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
  });
});
