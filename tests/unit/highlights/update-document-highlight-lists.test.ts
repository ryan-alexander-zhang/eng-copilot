import { describe, expect, it, vi } from "vitest";
import { updateDocumentHighlightLists } from "@/lib/highlights/update-document-highlight-lists";

describe("updateDocumentHighlightLists", () => {
  it("rejects submitted list ids that are not selectable built-in positives", async () => {
    const prisma = createPrismaMock({
      ownedDocument: { id: "doc_123" },
      selectableBuiltInLists: [
        {
          id: "list_positive",
          entries: [{ term: "alpha" }],
        },
      ],
      exclusionList: {
        entries: [{ term: "ignore-me" }],
      },
    });
    const recomputeHighlights = vi.fn();

    await expect(
      updateDocumentHighlightLists({
        documentId: "doc_123",
        ownerId: "user_123",
        selectedWordListIds: ["list_positive", "list_invalid"],
        prisma: prisma as never,
        recomputeHighlights,
      }),
    ).rejects.toThrow("Invalid word list selection");

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(recomputeHighlights).not.toHaveBeenCalled();
  });

  it("recomputes with an empty active term set when no positive lists are selected", async () => {
    const prisma = createPrismaMock({
      ownedDocument: { id: "doc_123" },
      selectableBuiltInLists: [
        {
          id: "list_positive",
          entries: [{ term: "alpha" }],
        },
      ],
      exclusionList: {
        entries: [{ term: "ignore-me" }],
      },
    });
    const recomputeHighlights = vi.fn();

    await updateDocumentHighlightLists({
      documentId: "doc_123",
      ownerId: "user_123",
      selectedWordListIds: [],
      prisma: prisma as never,
      recomputeHighlights,
    });

    expect(prisma.transactionDocumentWordList.deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: "doc_123",
      },
    });
    expect(prisma.transactionDocumentWordList.createMany).not.toHaveBeenCalled();
    expect(recomputeHighlights).toHaveBeenCalledWith({
      documentId: "doc_123",
      activeTerms: new Set<string>(),
      excludedTerms: new Set(["ignore-me"]),
      prisma: prisma.transactionClient,
    });
  });

  it("fails when the built-in exclusion list is missing", async () => {
    const prisma = createPrismaMock({
      ownedDocument: { id: "doc_123" },
      selectableBuiltInLists: [
        {
          id: "list_positive",
          entries: [{ term: "alpha" }],
        },
      ],
      exclusionList: null,
    });
    const recomputeHighlights = vi.fn();

    await expect(
      updateDocumentHighlightLists({
        documentId: "doc_123",
        ownerId: "user_123",
        selectedWordListIds: ["list_positive"],
        prisma: prisma as never,
        recomputeHighlights,
      }),
    ).rejects.toThrow("Built-in exclusion list not found");

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(recomputeHighlights).not.toHaveBeenCalled();
  });

  it("persists selected lists and recomputes highlights on success", async () => {
    const prisma = createPrismaMock({
      ownedDocument: { id: "doc_123" },
      selectableBuiltInLists: [
        {
          id: "list_alpha",
          entries: [{ term: "alpha" }],
        },
        {
          id: "list_beta",
          entries: [{ term: "beta" }, { term: "beta-2" }],
        },
      ],
      exclusionList: {
        entries: [{ term: "ignore-me" }, { term: "ignore-too" }],
      },
    });
    const recomputeHighlights = vi.fn();

    await updateDocumentHighlightLists({
      documentId: "doc_123",
      ownerId: "user_123",
      selectedWordListIds: ["list_beta"],
      prisma: prisma as never,
      recomputeHighlights,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.transactionDocumentWordList.deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: "doc_123",
      },
    });
    expect(prisma.transactionDocumentWordList.createMany).toHaveBeenCalledWith({
      data: [
        {
          documentId: "doc_123",
          wordListId: "list_beta",
        },
      ],
      skipDuplicates: true,
    });
    expect(recomputeHighlights).toHaveBeenCalledWith({
      documentId: "doc_123",
      activeTerms: new Set(["beta", "beta-2"]),
      excludedTerms: new Set(["ignore-me", "ignore-too"]),
      prisma: prisma.transactionClient,
    });
  });
});

function createPrismaMock(input: {
  ownedDocument: { id: string } | null;
  selectableBuiltInLists: Array<{
    id: string;
    entries: Array<{ term: string }>;
  }>;
  exclusionList: { entries: Array<{ term: string }> } | null;
}) {
  const transactionDocumentWordList = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn().mockResolvedValue({ count: input.selectableBuiltInLists.length }),
  };
  const transactionClient = {
    documentWordList: transactionDocumentWordList,
  };

  return {
    document: {
      findFirst: vi.fn().mockResolvedValue(input.ownedDocument),
    },
    wordList: {
      findMany: vi.fn().mockResolvedValue(input.selectableBuiltInLists),
      findUnique: vi.fn().mockResolvedValue(input.exclusionList),
    },
    $transaction: vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient),
    ),
    transactionClient,
    transactionDocumentWordList,
  };
}
