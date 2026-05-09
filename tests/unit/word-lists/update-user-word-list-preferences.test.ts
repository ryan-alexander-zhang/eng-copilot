import { describe, expect, it, vi } from "vitest";
import { updateUserWordListPreferences } from "@/lib/word-lists/update-user-word-list-preferences";

describe("updateUserWordListPreferences", () => {
  it("recomputes owned documents with selected built-in and owner vocabulary terms", async () => {
    const prisma = createPrismaMock();
    const recomputeHighlights = vi.fn();

    await updateUserWordListPreferences({
      ownerId: "user_123",
      selectedWordListIds: ["list_cet6"],
      prisma: prisma as never,
      recomputeHighlights,
    });

    expect(recomputeHighlights).toHaveBeenCalledWith({
      documentId: "doc_123",
      activeTerms: new Set(["harness", "observability"]),
      excludedTerms: new Set(["ignore-me"]),
      prisma: prisma.transactionClient,
    });
  });
});

function createPrismaMock() {
  const transactionUserWordListPreference = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
  };
  const transactionDocumentWordList = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
  };
  const transactionClient = {
    documentWordList: transactionDocumentWordList,
    userWordListPreference: transactionUserWordListPreference,
  };

  return {
    document: {
      findMany: vi.fn().mockResolvedValue([{ id: "doc_123" }]),
    },
    userWordListPreference: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    vocabularyEntry: {
      findMany: vi.fn().mockResolvedValue([{ word: "observability" }]),
    },
    wordList: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "list_cet6",
          entries: [{ term: "harness" }],
        },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        entries: [{ term: "ignore-me" }],
      }),
    },
    $transaction: vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient),
    ),
    transactionClient,
  };
}

