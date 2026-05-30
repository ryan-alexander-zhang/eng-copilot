import { describe, expect, it, vi } from "vitest";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";

describe("getOwnerActiveTerms", () => {
  it("includes owner vocabulary terms attached to selected word lists", async () => {
    const prisma = {
      userWordListPreference: {
        findMany: vi.fn().mockResolvedValue([
          { wordListId: "list_cet6" },
          { wordListId: "list_default" },
        ]),
      },
      vocabularyEntry: {
        findMany: vi.fn().mockResolvedValue([
          { word: "observability" },
          { word: "interoperability" },
        ]),
      },
      wordList: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "list_cet4",
            ownerId: null,
            entries: [{ term: "revise" }],
          },
          {
            id: "list_cet6",
            ownerId: null,
            entries: [{ term: "harness" }],
          },
          {
            id: "list_default",
            ownerId: "user_123",
            entries: [],
          },
        ]),
        findUnique: vi.fn().mockResolvedValue({
          entries: [{ term: "ignore-me" }],
        }),
      },
    };

    await expect(
      getOwnerActiveTerms({
        ownerId: "user_123",
        prisma: prisma as never,
      }),
    ).resolves.toEqual({
      selectedWordListIds: ["list_cet6", "list_default"],
      activeTerms: new Set(["harness", "observability", "interoperability"]),
      excludedTerms: new Set(["ignore-me"]),
    });

    expect(prisma.vocabularyEntry.findMany).toHaveBeenCalledWith({
      where: {
        ownerId: "user_123",
        wordLists: {
          some: {
            wordListId: {
              in: ["list_default"],
            },
          },
        },
      },
      select: {
        word: true,
      },
    });
  });
});
