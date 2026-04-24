type HighlightMatch = {
  term: string;
};

type ActiveWordList = {
  entries: Array<{
    term: string;
  }>;
  name: string;
};

export function buildMatchedWords(input: {
  activeWordLists: ActiveWordList[];
  highlightMatches: HighlightMatch[];
  limit?: number;
  order?: string[];
}) {
  const counts = input.highlightMatches.reduce<Map<string, number>>((nextCounts, match) => {
    nextCounts.set(match.term, (nextCounts.get(match.term) ?? 0) + 1);
    return nextCounts;
  }, new Map());
  const matchedWordEntries = [...counts.entries()];

  return {
    matchedWordCount: matchedWordEntries.length,
    matchedWords: matchedWordEntries
      .sort((left, right) => {
        const leftOrder = input.order?.indexOf(left[0]) ?? -1;
        const rightOrder = input.order?.indexOf(right[0]) ?? -1;

        if (leftOrder !== -1 || rightOrder !== -1) {
          return normalizeMatchOrder(leftOrder) - normalizeMatchOrder(rightOrder);
        }

        return right[1] - left[1] || left[0].localeCompare(right[0]);
      })
      .slice(0, input.limit ?? 8)
      .map(([term, count]) => ({
        count,
        listName:
          input.activeWordLists.find((wordList) =>
            wordList.entries.some((entry) => entry.term === term),
          )?.name ?? null,
        term,
      })),
  };
}

function normalizeMatchOrder(order: number) {
  return order === -1 ? Number.MAX_SAFE_INTEGER : order;
}
