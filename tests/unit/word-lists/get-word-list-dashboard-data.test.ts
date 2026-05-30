import { describe, expect, it, vi } from "vitest";
import { getWordListDashboardData } from "@/lib/word-lists/get-word-list-dashboard-data";

describe("getWordListDashboardData", () => {
  it("uses the persisted word-list entry count instead of catalog placeholder counts", async () => {
    const result = await getWordListDashboardData({
      ownerId: "user_123",
      prisma: {
        wordList: {
          upsert: vi.fn().mockResolvedValue({
            id: "list_default",
            name: "Default Word List",
            slug: "user-user_123-default-word-list",
            updatedAt: new Date("2026-05-10T00:00:00.000Z"),
          }),
          findMany: vi.fn().mockResolvedValue([
            {
              id: "list_cet4",
              name: "CET4",
              ownerId: null,
              slug: "cet4",
              updatedAt: new Date("2026-05-10T00:00:00.000Z"),
              _count: {
                entries: 2,
                vocabularyEntries: 0,
              },
            },
            {
              id: "list_default",
              name: "Default Word List",
              ownerId: "user_123",
              slug: "user-user_123-default-word-list",
              updatedAt: new Date("2026-05-10T00:00:00.000Z"),
              _count: {
                entries: 0,
                vocabularyEntries: 3,
              },
            },
          ]),
        },
        userWordListPreference: {
          findMany: vi.fn().mockResolvedValue([
            { wordListId: "list_cet4" },
            { wordListId: "list_default" },
          ]),
        },
        document: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    });

    expect(result.lists).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "list_cet4",
        isSelected: true,
        name: "CET4",
        slug: "cet4",
        wordCount: 2,
      }),
      expect.objectContaining({
        id: "list_default",
        isSelected: true,
        name: "Default Word List",
        wordCount: 3,
      }),
    ]));
    expect(result.totalSelectedWords).toBe(5);
  });
});
