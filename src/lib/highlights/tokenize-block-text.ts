export type BlockTextToken = {
  term: string;
  startOffset: number;
  endOffset: number;
};

const TOKEN_PATTERN = /\b[a-zA-Z][a-zA-Z'-]*\b/g;

export function tokenizeBlockText(text: string): BlockTextToken[] {
  return Array.from(text.matchAll(TOKEN_PATTERN)).flatMap((match) => {
    if (match.index == null) {
      return [];
    }

    return [
      {
        term: match[0].toLowerCase(),
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      },
    ];
  });
}
