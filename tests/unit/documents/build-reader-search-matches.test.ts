import { describe, expect, it } from "vitest";
import { buildReaderSearchMatches } from "@/lib/documents/build-reader-search-matches";

describe("buildReaderSearchMatches", () => {
  it("returns ordered case-insensitive matches across blocks", () => {
    const result = buildReaderSearchMatches({
      blocks: [
        { blockKey: "p:1", text: "Learning is valuable." },
        { blockKey: "p:2", text: "Valuable habits compound." },
      ],
      query: "valuable",
    });

    expect(result.totalCount).toBe(2);
    expect(result.matches).toEqual([
      {
        id: "p:1:12-20",
        blockKey: "p:1",
        startOffset: 12,
        endOffset: 20,
        text: "valuable",
      },
      {
        id: "p:2:0-8",
        blockKey: "p:2",
        startOffset: 0,
        endOffset: 8,
        text: "Valuable",
      },
    ]);
  });
});
