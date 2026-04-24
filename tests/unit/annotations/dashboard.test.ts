import { describe, expect, it } from "vitest";
import { buildAnnotationsDashboardData } from "@/lib/annotations/dashboard";

describe("buildAnnotationsDashboardData", () => {
  it("maps colors to annotation types and applies filters with pagination", () => {
    const data = buildAnnotationsDashboardData({
      annotations: [
        {
          id: "annotation-1",
          color: "yellow",
          createdAt: new Date("2026-04-24T10:24:00.000Z"),
          endBlockKey: "paragraph:1",
          endOffset: 5,
          note: "General note",
          quote: "culture",
          startBlockKey: "paragraph:1",
          startOffset: 0,
          tags: ["general"],
          updatedAt: new Date("2026-04-24T10:24:00.000Z"),
          document: {
            id: "document-1",
            originalName: "study-notes.md",
            title: "Study Notes",
            highlightMatches: [
              {
                blockKey: "paragraph:1",
                endOffset: 5,
                startOffset: 0,
                term: "culture",
              },
            ],
            activeLists: [
              {
                wordList: {
                  name: "CET4",
                  entries: [{ term: "culture" }],
                },
              },
            ],
          },
        },
        {
          id: "annotation-2",
          color: "blue",
          createdAt: new Date("2026-04-23T10:24:00.000Z"),
          endBlockKey: "paragraph:2",
          endOffset: 5,
          note: "Note text",
          quote: "simple",
          startBlockKey: "paragraph:2",
          startOffset: 0,
          tags: ["note"],
          updatedAt: new Date("2026-04-23T10:24:00.000Z"),
          document: {
            id: "document-2",
            originalName: "reading-list.md",
            title: "Reading List",
            highlightMatches: [],
            activeLists: [
              {
                wordList: {
                  name: "CET6",
                  entries: [{ term: "simple" }],
                },
              },
            ],
          },
        },
      ],
      filters: {
        type: "general",
        page: 1,
        pageSize: 5,
      },
    });

    expect(data.totalCount).toBe(2);
    expect(data.typeCounts.find((item) => item.key === "general")?.count).toBe(1);
    expect(data.typeCounts.find((item) => item.key === "note")?.count).toBe(1);
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      documentName: "study-notes.md",
      title: "General note",
      type: {
        label: "General",
        value: "general",
      },
      wordListName: "CET4",
    });
  });
});
