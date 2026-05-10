export function buildReaderSearchMatches(input: {
  blocks: Array<{ blockKey: string; text: string }>;
  query: string;
}) {
  const normalizedQuery = input.query.trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      totalCount: 0,
      matches: [],
    };
  }

  const matches = input.blocks.flatMap((block) => {
    const results: Array<{
      id: string;
      blockKey: string;
      startOffset: number;
      endOffset: number;
      text: string;
    }> = [];
    const haystack = block.text.toLowerCase();
    let fromIndex = 0;

    while (fromIndex < haystack.length) {
      const matchIndex = haystack.indexOf(normalizedQuery, fromIndex);

      if (matchIndex === -1) {
        break;
      }

      const endOffset = matchIndex + normalizedQuery.length;

      results.push({
        id: `${block.blockKey}:${matchIndex}-${endOffset}`,
        blockKey: block.blockKey,
        startOffset: matchIndex,
        endOffset,
        text: block.text.slice(matchIndex, endOffset),
      });

      fromIndex = endOffset;
    }

    return results;
  });

  return {
    totalCount: matches.length,
    matches,
  };
}
