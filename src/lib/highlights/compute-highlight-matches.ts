import type { ParsedBlock } from "@/lib/markdown/parse-markdown-to-blocks";
import { tokenizeBlockText } from "@/lib/highlights/tokenize-block-text";

export type HighlightMatch = {
  blockKey: string;
  startOffset: number;
  endOffset: number;
  term: string;
};

export function computeHighlightMatches(input: {
  blocks: ParsedBlock[];
  activeTerms: Set<string>;
  excludedTerms: Set<string>;
}): HighlightMatch[] {
  const matches: HighlightMatch[] = [];

  for (const block of input.blocks) {
    for (const token of tokenizeBlockText(block.text)) {
      if (!input.activeTerms.has(token.term) || input.excludedTerms.has(token.term)) {
        continue;
      }

      matches.push({
        blockKey: block.blockKey,
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        term: token.term,
      });
    }
  }

  return matches;
}
