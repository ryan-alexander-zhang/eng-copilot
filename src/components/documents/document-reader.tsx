type ReaderBlock = {
  blockKey: string;
  kind?: string;
  text: string;
};

type ReaderHighlightMatch = {
  id?: string;
  blockKey: string;
  startOffset: number;
  endOffset: number;
  term: string;
};

type ReaderAnnotation = {
  id: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
};

type AnnotationSegment = {
  annotationId: string;
  startOffset: number;
  endOffset: number;
};

export function buildAnnotationSegments(input: {
  blocks: Array<Pick<ReaderBlock, "blockKey" | "text">>;
  annotations: ReaderAnnotation[];
}) {
  const blockIndexByKey = new Map(
    input.blocks.map((block, index) => [block.blockKey, index] as const),
  );
  const segmentsByBlock: Record<string, AnnotationSegment[]> = {};

  for (const annotation of input.annotations) {
    const startIndex = blockIndexByKey.get(annotation.startBlockKey);
    const endIndex = blockIndexByKey.get(annotation.endBlockKey);

    if (startIndex === undefined || endIndex === undefined || startIndex > endIndex) {
      continue;
    }

    const startBlock = input.blocks[startIndex];
    const endBlock = input.blocks[endIndex];

    if (!isValidRange(annotation.startOffset, startBlock.text.length)) {
      continue;
    }

    if (!isValidRange(annotation.endOffset, endBlock.text.length)) {
      continue;
    }

    if (startIndex === endIndex && annotation.startOffset >= annotation.endOffset) {
      continue;
    }

    for (let index = startIndex; index <= endIndex; index += 1) {
      const block = input.blocks[index];
      const startOffset = index === startIndex ? annotation.startOffset : 0;
      const endOffset = index === endIndex ? annotation.endOffset : block.text.length;

      if (startOffset >= endOffset) {
        continue;
      }

      segmentsByBlock[block.blockKey] ??= [];
      segmentsByBlock[block.blockKey].push({
        annotationId: annotation.id,
        startOffset,
        endOffset,
      });
    }
  }

  for (const blockKey of Object.keys(segmentsByBlock)) {
    segmentsByBlock[blockKey].sort((left, right) => {
      if (left.startOffset !== right.startOffset) {
        return left.startOffset - right.startOffset;
      }

      return left.endOffset - right.endOffset;
    });
  }

  return segmentsByBlock;
}

export function DocumentReader({
  blocks,
  highlightMatches,
  annotations,
}: {
  blocks: ReaderBlock[];
  highlightMatches: ReaderHighlightMatch[];
  annotations: ReaderAnnotation[];
}) {
  const annotationSegments = buildAnnotationSegments({ blocks, annotations });
  const highlightMatchesByBlock = groupByBlock(highlightMatches);

  return (
    <section aria-label="Document reader">
      <h2>Reader</h2>
      {blocks.length === 0 ? <p>No readable content.</p> : null}
      {blocks.map((block) => {
        const inlineContent = renderInlineContent({
          text: block.text,
          highlightMatches: highlightMatchesByBlock[block.blockKey] ?? [],
          annotationSegments: annotationSegments[block.blockKey] ?? [],
        });

        switch (block.kind) {
          case "heading":
            return <h3 key={block.blockKey}>{inlineContent}</h3>;
          case "list-item":
            return (
              <p key={block.blockKey}>
                • {inlineContent}
              </p>
            );
          case "blockquote":
            return <blockquote key={block.blockKey}>{inlineContent}</blockquote>;
          case "code":
            return (
              <pre key={block.blockKey}>
                <code>{inlineContent}</code>
              </pre>
            );
          default:
            return <p key={block.blockKey}>{inlineContent}</p>;
        }
      })}
    </section>
  );
}

function renderInlineContent(input: {
  text: string;
  highlightMatches: ReaderHighlightMatch[];
  annotationSegments: AnnotationSegment[];
}) {
  const slices = buildRenderSlices(input);

  if (slices.length === 0) {
    return input.text;
  }

  return slices.map((slice, index) => {
    const style =
      slice.highlightTerms.length > 0 || slice.annotationIds.length > 0
        ? {
            backgroundColor: slice.highlightTerms.length > 0 ? "#fef08a" : undefined,
            textDecoration: slice.annotationIds.length > 0 ? "underline" : undefined,
            textDecorationColor: slice.annotationIds.length > 0 ? "#2563eb" : undefined,
            textUnderlineOffset: slice.annotationIds.length > 0 ? "0.2em" : undefined,
          }
        : undefined;

    return (
      <span
        key={`${slice.startOffset}-${slice.endOffset}-${index}`}
        data-annotation-ids={
          slice.annotationIds.length > 0 ? slice.annotationIds.join(",") : undefined
        }
        title={buildSliceTitle(slice.highlightTerms, slice.annotationIds) ?? undefined}
        style={style}
      >
        {slice.text}
      </span>
    );
  });
}

function buildRenderSlices(input: {
  text: string;
  highlightMatches: ReaderHighlightMatch[];
  annotationSegments: AnnotationSegment[];
}) {
  if (input.text.length === 0) {
    return [];
  }

  const validHighlightMatches = input.highlightMatches.filter(
    (match) =>
      isValidRange(match.startOffset, input.text.length) &&
      isValidRange(match.endOffset, input.text.length) &&
      match.startOffset < match.endOffset,
  );
  const boundaries = new Set([0, input.text.length]);

  for (const match of validHighlightMatches) {
    boundaries.add(match.startOffset);
    boundaries.add(match.endOffset);
  }

  for (const segment of input.annotationSegments) {
    if (
      !isValidRange(segment.startOffset, input.text.length) ||
      !isValidRange(segment.endOffset, input.text.length) ||
      segment.startOffset >= segment.endOffset
    ) {
      continue;
    }

    boundaries.add(segment.startOffset);
    boundaries.add(segment.endOffset);
  }

  const sortedBoundaries = [...boundaries].sort((left, right) => left - right);
  const slices: Array<{
    text: string;
    startOffset: number;
    endOffset: number;
    highlightTerms: string[];
    annotationIds: string[];
  }> = [];

  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const startOffset = sortedBoundaries[index];
    const endOffset = sortedBoundaries[index + 1];

    if (startOffset === endOffset) {
      continue;
    }

    slices.push({
      text: input.text.slice(startOffset, endOffset),
      startOffset,
      endOffset,
      highlightTerms: validHighlightMatches
        .filter((match) => match.startOffset <= startOffset && endOffset <= match.endOffset)
        .map((match) => match.term),
      annotationIds: input.annotationSegments
        .filter((segment) => segment.startOffset <= startOffset && endOffset <= segment.endOffset)
        .map((segment) => segment.annotationId),
    });
  }

  return slices;
}

function groupByBlock<T extends { blockKey: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.blockKey] ??= [];
    groups[item.blockKey].push(item);
    return groups;
  }, {});
}

function buildSliceTitle(highlightTerms: string[], annotationIds: string[]) {
  const parts: string[] = [];

  if (highlightTerms.length > 0) {
    parts.push(`Highlights: ${highlightTerms.join(", ")}`);
  }

  if (annotationIds.length > 0) {
    parts.push(`Annotations: ${annotationIds.join(", ")}`);
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

function isValidRange(offset: number, textLength: number) {
  return Number.isInteger(offset) && offset >= 0 && offset <= textLength;
}
