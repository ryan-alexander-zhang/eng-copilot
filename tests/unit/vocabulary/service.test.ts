import { describe, expect, it, vi } from "vitest";
import {
  exportVocabularyJson,
  importVocabularyJson,
  saveVocabularyEntry,
} from "@/lib/vocabulary/service";

describe("saveVocabularyEntry", () => {
  it("upserts a private normalized word with note and replaces its word-list associations", async () => {
    const prisma = createVocabularyPrismaMock();

    await expect(
      saveVocabularyEntry({
        ownerId: "user_123",
        word: " Observability ",
        note: "Useful in academic writing",
        wordListSlugs: [
          "user-user_123-default-word-list",
          "user-user_123-academic-review",
        ],
        source: "plugin",
        prisma: prisma as never,
        recomputeOwnerHighlights: vi.fn(),
      }),
    ).resolves.toMatchObject({
      note: "Useful in academic writing",
      word: "observability",
      source: "plugin",
      wordListSlugs: [
        "user-user_123-default-word-list",
        "user-user_123-academic-review",
      ],
    });

    expect(prisma.transactionVocabularyEntry.upsert).toHaveBeenCalledWith({
      where: {
        ownerId_word: {
          ownerId: "user_123",
          word: "observability",
        },
      },
      update: {
        note: "Useful in academic writing",
        source: "plugin",
      },
      create: {
        note: "Useful in academic writing",
        ownerId: "user_123",
        word: "observability",
        source: "plugin",
      },
      select: {
        createdAt: true,
        id: true,
        note: true,
        source: true,
        updatedAt: true,
        word: true,
      },
    });
    expect(prisma.transactionVocabularyEntryWordList.deleteMany).toHaveBeenCalledWith({
      where: {
        vocabularyEntryId: "entry_123",
      },
    });
    expect(prisma.transactionVocabularyEntryWordList.createMany).toHaveBeenCalledWith({
      data: [
        {
          vocabularyEntryId: "entry_123",
          wordListId: "list_default",
        },
        {
          vocabularyEntryId: "entry_123",
          wordListId: "list_academic_review",
        },
      ],
      skipDuplicates: true,
    });
  });

  it("rejects system word-list slugs", async () => {
    const prisma = createVocabularyPrismaMock();

    await expect(
      saveVocabularyEntry({
        ownerId: "user_123",
        word: "revise",
        wordListSlugs: ["cet6"],
        prisma: prisma as never,
        recomputeOwnerHighlights: vi.fn(),
      }),
    ).rejects.toThrow("Invalid word list slug");

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("importVocabularyJson", () => {
  it("merges versioned entries by normalized word", async () => {
    const prisma = createVocabularyPrismaMock();
    const recomputeOwnerHighlights = vi.fn();

    await importVocabularyJson({
      ownerId: "user_123",
      payload: {
        version: 1,
        entries: [
          {
            word: "Revise",
            note: "first note",
            wordListSlugs: ["user-user_123-default-word-list"],
            source: "import",
          },
          {
            word: " revise ",
            note: "last note wins",
            wordListSlugs: ["user-user_123-academic-review"],
            source: "plugin",
          },
        ],
      },
      prisma: prisma as never,
      recomputeOwnerHighlights,
    });

    expect(prisma.transactionVocabularyEntry.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.transactionVocabularyEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerId_word: {
            ownerId: "user_123",
            word: "revise",
          },
        },
        update: {
          note: "last note wins",
          source: "plugin",
        },
      }),
    );
    expect(recomputeOwnerHighlights).toHaveBeenCalledTimes(1);
  });
});

describe("exportVocabularyJson", () => {
  it("exports versioned user vocabulary with notes and word-list slugs", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        note: "Useful in academic writing",
        word: "observability",
        source: "manual",
        wordLists: [
          {
            wordList: {
              slug: "user-user_123-default-word-list",
            },
          },
          {
            wordList: {
              slug: "user-user_123-academic-review",
            },
          },
        ],
      },
    ]);

    await expect(
      exportVocabularyJson({
        ownerId: "user_123",
        prisma: {
          vocabularyEntry: {
            findMany,
          },
        } as never,
      }),
    ).resolves.toEqual({
      version: 1,
      entries: [
        {
          note: "Useful in academic writing",
          word: "observability",
          source: "manual",
          wordListSlugs: [
            "user-user_123-default-word-list",
            "user-user_123-academic-review",
          ],
        },
      ],
    });
  });
});

function createVocabularyPrismaMock() {
  const now = new Date("2026-05-09T00:00:00.000Z");
  const selectableLists = [
    { id: "list_default", slug: "user-user_123-default-word-list" },
    { id: "list_academic_review", slug: "user-user_123-academic-review" },
  ];
  const transactionVocabularyEntry = {
    upsert: vi.fn().mockResolvedValue({
      id: "entry_123",
      note: "Useful in academic writing",
      word: "observability",
      source: "plugin",
      createdAt: now,
      updatedAt: now,
    }),
  };
  const transactionVocabularyEntryWordList = {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn().mockResolvedValue({ count: 2 }),
  };
  const transactionClient = {
    vocabularyEntry: transactionVocabularyEntry,
    vocabularyEntryWordList: transactionVocabularyEntryWordList,
  };

  return {
    wordList: {
      upsert: vi.fn().mockResolvedValue({
        id: "list_default",
        name: "Default Word List",
        slug: "user-user_123-default-word-list",
        updatedAt: now,
      }),
      findMany: vi.fn().mockResolvedValue(selectableLists),
    },
    $transaction: vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient),
    ),
    transactionClient,
    transactionVocabularyEntry,
    transactionVocabularyEntryWordList,
  };
}
