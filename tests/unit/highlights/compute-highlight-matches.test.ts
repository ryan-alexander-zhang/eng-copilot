import { describe, expect, it } from "vitest";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";

describe("computeHighlightMatches", () => {
  it("keeps active positive matches and removes excluded terms", () => {
    const blocks = parseMarkdownToBlocks("# Title\n\nalpha beta gamma");
    const matches = computeHighlightMatches({
      blocks,
      activeTerms: new Set(["beta", "gamma"]),
      excludedTerms: new Set(["gamma"]),
    });

    expect(matches).toEqual([
      {
        blockKey: "paragraph:1",
        startOffset: 6,
        endOffset: 10,
        term: "beta",
      },
    ]);
  });
});
