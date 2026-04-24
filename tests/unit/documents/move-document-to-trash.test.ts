import { describe, expect, it, vi } from "vitest";
import { moveDocumentToTrash } from "@/lib/documents/move-document-to-trash";

describe("moveDocumentToTrash", () => {
  it("marks an owned document as trashed and returns its share token", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "doc_123",
      share: {
        token: "share-token",
      },
    });
    const update = vi.fn().mockResolvedValue({ id: "doc_123" });

    const result = await moveDocumentToTrash({
      documentId: "doc_123",
      ownerId: "user_123",
      prisma: {
        document: {
          findFirst,
          update,
        },
      } as never,
    });

    expect(result).toEqual({
      id: "doc_123",
      shareToken: "share-token",
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: "doc_123",
        ownerId: "user_123",
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
    expect(update).toHaveBeenCalledWith({
      where: {
        id: "doc_123",
      },
      data: {
        trashedAt: expect.any(Date),
      },
    });
  });
});
