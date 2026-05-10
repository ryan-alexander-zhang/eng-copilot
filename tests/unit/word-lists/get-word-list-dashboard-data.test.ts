import { describe, expect, it, vi } from "vitest";
import { getWordListDashboardData } from "@/lib/word-lists/get-word-list-dashboard-data";

describe("getWordListDashboardData", () => {
  it("uses the persisted word-list entry count instead of catalog placeholder counts", async () => {
    const result = await getWordListDashboardData({
      ownerId: "user_123",
      prisma: {
        wordList: {
          findMany: vi.fn().mockResolvedValue([
            {
              entries: [{ term: "alpha" }, { term: "beta" }],
              id: "list_cet4",
              name: "CET4",
              slug: "cet4",
              updatedAt: new Date("2026-05-10T00:00:00.000Z"),
            },
          ]),
        },
        userWordListPreference: {
          findMany: vi.fn().mockResolvedValue([{ wordListId: "list_cet4" }]),
        },
        document: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    });

    expect(result.lists).toEqual([
      expect.objectContaining({
        id: "list_cet4",
        isSelected: true,
        name: "CET4",
        slug: "cet4",
        wordCount: 2,
      }),
    ]);
    expect(result.totalSelectedWords).toBe(2);
  });
});
