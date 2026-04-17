import { describe, expect, it } from "vitest";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";

describe("computeHighlightMatches", () => {
  it("keeps active positive matches and removes excluded terms", () => {
    const blocks = parseMarkdownToBlocks("# Title\n\nalpha beta gamma");
    const paragraphBlock = blocks.find((block) => block.kind === "paragraph");

    expect(paragraphBlock).toMatchObject({
      kind: "paragraph",
      text: "alpha beta gamma",
    });
    expect(paragraphBlock?.blockKey).toMatch(/^paragraph:[0-9a-f]{8}$/);

    const matches = computeHighlightMatches({
      blocks,
      activeTerms: new Set(["beta", "gamma"]),
      excludedTerms: new Set(["gamma"]),
    });

    expect(matches).toEqual([
      {
        blockKey: paragraphBlock!.blockKey,
        startOffset: 6,
        endOffset: 10,
        term: "beta",
      },
    ]);
  });

  it("emits one visible surface per nested list item and blockquote paragraph", () => {
    const blocks = parseMarkdownToBlocks("- alpha\n  - beta\n\n> gamma");

    expect(blocks.map(({ kind, text }) => ({ kind, text }))).toEqual([
      { kind: "list-item", text: "alpha" },
      { kind: "list-item", text: "beta" },
      { kind: "blockquote", text: "gamma" },
    ]);

    const matches = computeHighlightMatches({
      blocks,
      activeTerms: new Set(["alpha", "beta", "gamma"]),
      excludedTerms: new Set(),
    });

    expect(matches.map(({ term }) => term)).toEqual(["alpha", "beta", "gamma"]);
    expect(new Set(matches.map(({ blockKey }) => blockKey)).size).toBe(3);
  });

  it("keeps a paragraph block key stable when unrelated earlier content is inserted", () => {
    const originalBlocks = parseMarkdownToBlocks("alpha\n\nbeta");
    const shiftedBlocks = parseMarkdownToBlocks("# Title\n\nalpha\n\nbeta");

    const originalBeta = originalBlocks.find((block) => block.text === "beta");
    const shiftedBeta = shiftedBlocks.find((block) => block.text === "beta");

    expect(originalBeta).toMatchObject({
      kind: "paragraph",
      text: "beta",
    });
    expect(shiftedBeta).toMatchObject({
      kind: "paragraph",
      text: "beta",
    });
    expect(shiftedBeta?.blockKey).toBe(originalBeta?.blockKey);
  });
});
