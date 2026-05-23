export type BlockRun = {
  startOffset: number;
  endOffset: number;
  highlightTerms: string[];
  searchMatchIds: string[];
  annotationIds: string[];
  annotationColor?: string | null;
};

type HighlightRange = {
  startOffset: number;
  endOffset: number;
  term: string;
};

type SearchRange = {
  id: string;
  startOffset: number;
  endOffset: number;
};

type AnnotationRange = {
  annotationId: string;
  color?: string | null;
  startOffset: number;
  endOffset: number;
};

type ActiveHighlight = HighlightRange & { key: string };
type ActiveSearch = SearchRange & { key: string };
type ActiveAnnotation = AnnotationRange & { key: string };

export function buildBlockRuns(input: {
  textLength: number;
  highlightMatches: HighlightRange[];
  searchMatches: SearchRange[];
  annotationSegments: AnnotationRange[];
}): BlockRun[] {
  if (input.textLength === 0) {
    return [];
  }

  const validHighlightMatches = input.highlightMatches
    .filter((match) => isValidRange(match.startOffset, match.endOffset, input.textLength))
    .map((match) => ({
      ...match,
      key: `${match.term}:${match.startOffset}-${match.endOffset}`,
    }));
  const validSearchMatches = input.searchMatches
    .filter((match) => isValidRange(match.startOffset, match.endOffset, input.textLength))
    .map((match) => ({
      ...match,
      key: `${match.id}:${match.startOffset}-${match.endOffset}`,
    }));
  const validAnnotationSegments = input.annotationSegments
    .filter((segment) => isValidRange(segment.startOffset, segment.endOffset, input.textLength))
    .map((segment) => ({
      ...segment,
      key: `${segment.annotationId}:${segment.startOffset}-${segment.endOffset}`,
    }));

  const boundaries = new Set([0, input.textLength]);
  const highlightStarts = new Map<number, ActiveHighlight[]>();
  const highlightEnds = new Map<number, ActiveHighlight[]>();
  const searchStarts = new Map<number, ActiveSearch[]>();
  const searchEnds = new Map<number, ActiveSearch[]>();
  const annotationStarts = new Map<number, ActiveAnnotation[]>();
  const annotationEnds = new Map<number, ActiveAnnotation[]>();

  for (const match of validHighlightMatches) {
    boundaries.add(match.startOffset);
    boundaries.add(match.endOffset);
    pushEvent(highlightStarts, match.startOffset, match);
    pushEvent(highlightEnds, match.endOffset, match);
  }

  for (const match of validSearchMatches) {
    boundaries.add(match.startOffset);
    boundaries.add(match.endOffset);
    pushEvent(searchStarts, match.startOffset, match);
    pushEvent(searchEnds, match.endOffset, match);
  }

  for (const segment of validAnnotationSegments) {
    boundaries.add(segment.startOffset);
    boundaries.add(segment.endOffset);
    pushEvent(annotationStarts, segment.startOffset, segment);
    pushEvent(annotationEnds, segment.endOffset, segment);
  }

  const sortedBoundaries = [...boundaries].sort((left, right) => left - right);
  const activeHighlights: ActiveHighlight[] = [];
  const activeSearches: ActiveSearch[] = [];
  const activeAnnotations: ActiveAnnotation[] = [];
  const runs: BlockRun[] = [];

  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const offset = sortedBoundaries[index];
    const nextOffset = sortedBoundaries[index + 1];

    removeEvents(activeHighlights, highlightEnds.get(offset));
    removeEvents(activeSearches, searchEnds.get(offset));
    removeEvents(activeAnnotations, annotationEnds.get(offset));

    addEvents(activeHighlights, highlightStarts.get(offset), compareByRangeThenKey);
    addEvents(activeSearches, searchStarts.get(offset), compareByRangeThenKey);
    addEvents(activeAnnotations, annotationStarts.get(offset), compareByRangeThenKey);

    if (offset === nextOffset) {
      continue;
    }

    runs.push({
      startOffset: offset,
      endOffset: nextOffset,
      highlightTerms: activeHighlights.map((match) => match.term),
      searchMatchIds: activeSearches.map((match) => match.id),
      annotationIds: activeAnnotations.map((segment) => segment.annotationId),
      annotationColor: activeAnnotations[0]?.color,
    });
  }

  return runs;
}

function pushEvent<T>(
  map: Map<number, T[]>,
  offset: number,
  event: T,
) {
  map.set(offset, [...(map.get(offset) ?? []), event]);
}

function addEvents<T extends { key: string }>(
  activeItems: T[],
  events: T[] | undefined,
  compare: (left: T, right: T) => number,
) {
  for (const event of events ?? []) {
    if (!activeItems.some((item) => item.key === event.key)) {
      activeItems.push(event);
    }
  }

  activeItems.sort(compare);
}

function removeEvents<T extends { key: string }>(
  activeItems: T[],
  events: T[] | undefined,
) {
  if (!events || events.length === 0) {
    return;
  }

  const eventKeys = new Set(events.map((event) => event.key));

  for (let index = activeItems.length - 1; index >= 0; index -= 1) {
    if (eventKeys.has(activeItems[index].key)) {
      activeItems.splice(index, 1);
    }
  }
}

function compareByRangeThenKey(
  left: { startOffset: number; endOffset: number; key: string },
  right: { startOffset: number; endOffset: number; key: string },
) {
  if (left.startOffset !== right.startOffset) {
    return left.startOffset - right.startOffset;
  }

  if (left.endOffset !== right.endOffset) {
    return left.endOffset - right.endOffset;
  }

  return left.key.localeCompare(right.key);
}

function isValidRange(startOffset: number, endOffset: number, textLength: number) {
  return (
    Number.isInteger(startOffset) &&
    Number.isInteger(endOffset) &&
    startOffset >= 0 &&
    endOffset <= textLength &&
    startOffset < endOffset
  );
}
