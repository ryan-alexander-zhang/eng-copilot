import { describe, expect, it, vi } from "vitest";
import { createAnnotation } from "@/lib/annotations/create-annotation";
import { deleteAnnotation } from "@/lib/annotations/delete-annotation";
import { updateAnnotation } from "@/lib/annotations/update-annotation";

describe("createAnnotation", () => {
  it("rejects an empty cross-block selection", async () => {
    const documentFindFirst = vi.fn().mockResolvedValue({
      blocks: [
        { blockKey: "paragraph:0", text: "alpha" },
        { blockKey: "paragraph:1", text: "beta" },
      ],
    });

    await expect(
      createAnnotation({
        documentId: "doc_123",
        ownerId: "user_123",
        startBlockKey: "paragraph:0",
        startOffset: 5,
        endBlockKey: "paragraph:1",
        endOffset: 0,
        note: " note ",
        prisma: {
          document: {
            findFirst: documentFindFirst,
          },
          annotation: {
            create: vi.fn(),
          },
        } as never,
      }),
    ).rejects.toThrow("Annotation quote cannot be empty");
  });

  it("builds a multi-block quote from the visible selected text and trims the note", async () => {
    const create = vi.fn().mockResolvedValue({ id: "ann_123" });

    await expect(
      createAnnotation({
        documentId: "doc_123",
        ownerId: "user_123",
        startBlockKey: "paragraph:0",
        startOffset: 2,
        endBlockKey: "paragraph:2",
        endOffset: 3,
        note: " note ",
        prisma: {
          document: {
            findFirst: vi.fn().mockResolvedValue({
              blocks: [
                { blockKey: "paragraph:0", text: "alpha" },
                { blockKey: "paragraph:1", text: "beta" },
                { blockKey: "paragraph:2", text: "gamma" },
              ],
            }),
          },
          annotation: {
            create,
          },
        } as never,
      }),
    ).resolves.toEqual({ id: "ann_123" });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quote: "pha\nbeta\ngam",
        note: "note",
      }),
    });
  });

  it("rejects an invalid reversed block range", async () => {
    await expect(
      createAnnotation({
        documentId: "doc_123",
        ownerId: "user_123",
        startBlockKey: "paragraph:1",
        startOffset: 0,
        endBlockKey: "paragraph:0",
        endOffset: 1,
        note: "note",
        prisma: {
          document: {
            findFirst: vi.fn().mockResolvedValue({
              blocks: [
                { blockKey: "paragraph:0", text: "alpha" },
                { blockKey: "paragraph:1", text: "beta" },
              ],
            }),
          },
          annotation: {
            create: vi.fn(),
          },
        } as never,
      }),
    ).rejects.toThrow("Invalid annotation range");
  });
});

describe("updateAnnotation", () => {
  it("updates through an owner-scoped write and trims the note", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    await expect(
      updateAnnotation({
        annotationId: "ann_123",
        documentId: "doc_123",
        ownerId: "user_123",
        note: " note ",
        prisma: {
          annotation: {
            updateMany,
          },
        } as never,
      }),
    ).resolves.toEqual({ count: 1 });

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "ann_123",
        documentId: "doc_123",
        ownerId: "user_123",
      },
      data: {
        color: "yellow",
        note: "note",
        tags: [],
      },
    });
  });

  it("rejects updates for an annotation the owner does not control", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      updateAnnotation({
        annotationId: "ann_123",
        documentId: "doc_123",
        ownerId: "user_123",
        note: " note ",
        prisma: {
          annotation: {
            updateMany,
          },
        } as never,
      }),
    ).rejects.toThrow("Annotation not found");

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "ann_123",
        documentId: "doc_123",
        ownerId: "user_123",
      },
      data: {
        color: "yellow",
        note: "note",
        tags: [],
      },
    });
  });
});

describe("deleteAnnotation", () => {
  it("rejects deletes for an annotation the owner does not control", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      deleteAnnotation({
        annotationId: "ann_123",
        documentId: "doc_123",
        ownerId: "user_123",
        prisma: {
          annotation: {
            deleteMany,
          },
        } as never,
      }),
    ).rejects.toThrow("Annotation not found");

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        id: "ann_123",
        documentId: "doc_123",
        ownerId: "user_123",
      },
    });
  });
});
