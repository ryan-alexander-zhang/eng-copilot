import { describe, expect, it, vi } from "vitest";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";

describe("recomputeDocumentHighlights", () => {
  it("replaces persisted highlight rows using document blocks and filtered terms", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      blocks: [
        { blockKey: "paragraph:1", text: "alpha beta" },
        { blockKey: "paragraph:2", text: "gamma beta" },
      ],
    });
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const createMany = vi.fn().mockResolvedValue({ count: 2 });

    await recomputeDocumentHighlights({
      documentId: "doc_123",
      activeTerms: new Set(["beta", "gamma"]),
      excludedTerms: new Set(["gamma"]),
      prisma: {
        document: {
          findUnique,
        },
        highlightMatch: {
          deleteMany,
          createMany,
        },
      } as never,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        id: "doc_123",
      },
      select: {
        blocks: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            blockKey: true,
            text: true,
          },
        },
      },
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: "doc_123",
      },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          documentId: "doc_123",
          blockKey: "paragraph:1",
          startOffset: 6,
          endOffset: 10,
          term: "beta",
        },
        {
          documentId: "doc_123",
          blockKey: "paragraph:2",
          startOffset: 6,
          endOffset: 10,
          term: "beta",
        },
      ],
    });
  });
});
