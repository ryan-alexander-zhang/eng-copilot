import { describe, expect, it } from "vitest";
import { buildMatchedWords } from "@/lib/documents/build-matched-words";

describe("buildMatchedWords", () => {
  it("keeps both the total count and the sorted preview items", () => {
    const result = buildMatchedWords({
      activeWordLists: [
        {
          name: "CET4",
          entries: [{ term: "valuable" }, { term: "opportunities" }],
        },
        {
          name: "CET6",
          entries: [{ term: "necessity" }],
        },
      ],
      highlightMatches: [
        { term: "valuable" },
        { term: "necessity" },
        { term: "valuable" },
      ],
      order: ["valuable", "necessity", "opportunities"],
    });

    expect(result.matchedWordCount).toBe(2);
    expect(result.matchedWords).toEqual([
      {
        term: "valuable",
        count: 2,
        listName: "CET4",
      },
      {
        term: "necessity",
        count: 1,
        listName: "CET6",
      },
    ]);
  });
});
