import { describe, expect, it, vi } from "vitest";
import { getActiveWordListsWithTerms } from "@/lib/word-lists/get-active-word-lists-with-terms";

describe("getActiveWordListsWithTerms", () => {
  it("uses owner vocabulary for custom lists", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "list_cet4",
        name: "CET4",
        ownerId: null,
        entries: [{ term: "ability" }, { term: "access" }],
        vocabularyEntries: [],
      },
      {
        id: "list_default",
        name: "Default Word List",
        ownerId: "user_123",
        entries: [{ term: "ignore-me" }],
        vocabularyEntries: [
          {
            vocabularyEntry: {
              word: "observability",
            },
          },
        ],
      },
    ]);

    await expect(
      getActiveWordListsWithTerms({
        ownerId: "user_123",
        prisma: {
          wordList: {
            findMany,
          },
        } as never,
        wordListIds: ["list_cet4", "list_default"],
      }),
    ).resolves.toEqual([
      {
        id: "list_cet4",
        name: "CET4",
        entries: [{ term: "ability" }, { term: "access" }],
      },
      {
        id: "list_default",
        name: "Default Word List",
        entries: [{ term: "observability" }],
      },
    ]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["list_cet4", "list_default"],
        },
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        entries: {
          select: {
            term: true,
          },
        },
        vocabularyEntries: {
          where: {
            vocabularyEntry: {
              ownerId: "user_123",
            },
          },
          select: {
            vocabularyEntry: {
              select: {
                word: true,
              },
            },
          },
        },
      },
    });
  });
});
