import { getAnnotationColor, normalizeAnnotationColor } from "@/lib/annotations/presentation";

const DEFAULT_ANNOTATION_TYPE_LABEL = "Untagged";

export type SharedViewAnnotation = {
  color?: string | null;
  createdAt: Date;
  endBlockKey: string;
  endOffset: number;
  id: string;
  note: string;
  quote: string;
  startBlockKey: string;
  startOffset: number;
  tags: string[];
  updatedAt: Date;
};

export type SharedViewBlock = {
  blockKey: string;
  text: string;
};

export type SharedViewHighlightMatch = {
  blockKey: string;
  endOffset: number;
  startOffset: number;
  term: string;
};

export type SharedViewWordList = {
  entries: Array<{
    term: string;
  }>;
  id: string;
  name: string;
  slug: string;
};

type SharedAnnotationsIndexFilters = {
  color?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  type?: string;
  wordList?: string;
};

export function buildAnnotationSourcePreview(input: {
  annotation: SharedViewAnnotation;
  blocks: SharedViewBlock[];
  contextCharacters?: number;
}) {
  const joinedRange = buildJoinedAnnotationRange(input.annotation, input.blocks);
  const contextCharacters = input.contextCharacters ?? 48;

  if (!joinedRange) {
    const highlight = input.annotation.quote.trim() || input.annotation.note.trim() || "No source text";

    return {
      afterText: "",
      beforeText: "",
      fullText: highlight,
      hasLeadingEllipsis: false,
      hasTrailingEllipsis: false,
      highlightText: highlight,
    };
  }

  const previewStart = Math.max(0, joinedRange.highlightStart - contextCharacters);
  const previewEnd = Math.min(
    joinedRange.text.length,
    joinedRange.highlightEnd + contextCharacters,
  );

  return {
    afterText: joinedRange.text.slice(joinedRange.highlightEnd, previewEnd).trimEnd(),
    beforeText: joinedRange.text.slice(previewStart, joinedRange.highlightStart).trimStart(),
    fullText: joinedRange.text.slice(previewStart, previewEnd).trim(),
    hasLeadingEllipsis: previewStart > 0,
    hasTrailingEllipsis: previewEnd < joinedRange.text.length,
    highlightText: joinedRange.text.slice(
      joinedRange.highlightStart,
      joinedRange.highlightEnd,
    ),
  };
}

export function buildSharedAnnotationsIndexData(input: {
  activeWordLists: SharedViewWordList[];
  annotations: SharedViewAnnotation[];
  blocks: SharedViewBlock[];
  filters: SharedAnnotationsIndexFilters;
  highlightMatches: SharedViewHighlightMatch[];
  token: string;
}) {
  const items = input.annotations.map((annotation) =>
    buildSharedAnnotationListItem({
      activeWordLists: input.activeWordLists,
      annotation,
      blocks: input.blocks,
      highlightMatches: input.highlightMatches,
      token: input.token,
    }),
  );
  const filteredItems = items.filter((item) => {
    const query = input.filters.q?.trim().toLowerCase() ?? "";

    if (
      query.length > 0 &&
      ![item.excerpt, item.title, item.type.label, item.wordListName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (input.filters.wordList && input.filters.wordList !== "all" && item.wordListName !== input.filters.wordList) {
      return false;
    }

    if (input.filters.type && input.filters.type !== "all" && item.type.value !== input.filters.type) {
      return false;
    }

    if (input.filters.color && input.filters.color !== "all" && item.color !== input.filters.color) {
      return false;
    }

    return true;
  });
  const sortedItems = [...filteredItems].sort((left, right) => {
    if (input.filters.sort === "oldest") {
      return left.createdAt.getTime() - right.createdAt.getTime();
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
  const pageSize = input.filters.pageSize ?? 5;
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = clampPage(input.filters.page ?? 1, totalPages);
  const pageItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    colorOptions: [
      { label: "All colors", value: "all" },
      ...dedupeOptions(
        items.map((item) => ({
          label: item.color[0]!.toUpperCase() + item.color.slice(1),
          value: item.color,
        })),
      ),
    ],
    currentPage,
    items: pageItems,
    paginationItems: buildPaginationItems(currentPage, totalPages),
    totalCount: items.length,
    totalPages,
    typeCounts: buildTypeCounts(items),
    typeOptions: [
      { label: "All types", value: "all" },
      ...dedupeOptions(
        items.map((item) => ({
          label: item.type.label,
          value: item.type.value,
        })),
      ),
    ],
    wordListOptions: [
      { label: "All word lists", value: "all" },
      ...dedupeOptions(
        items
          .filter((item) => item.wordListName)
          .map((item) => ({
            label: item.wordListName as string,
            value: item.wordListName as string,
          })),
      ),
    ],
  };
}

export function getSharedAnnotationTypeLabel(tags: string[]) {
  return formatTypeLabel(tags[0] ?? DEFAULT_ANNOTATION_TYPE_LABEL);
}

export function getSharedAnnotationWordListName(input: {
  activeWordLists: SharedViewWordList[];
  annotation: SharedViewAnnotation;
  blocks: SharedViewBlock[];
  highlightMatches: SharedViewHighlightMatch[];
}) {
  const blockIndexByKey = new Map(
    input.blocks.map((block, index) => [block.blockKey, index] as const),
  );
  const startIndex = blockIndexByKey.get(input.annotation.startBlockKey);
  const endIndex = blockIndexByKey.get(input.annotation.endBlockKey);

  if (startIndex === undefined || endIndex === undefined || startIndex > endIndex) {
    return input.activeWordLists[0]?.name ?? null;
  }

  const overlappingHighlight = input.highlightMatches.find((highlight) => {
    const highlightBlockIndex = blockIndexByKey.get(highlight.blockKey);

    if (highlightBlockIndex === undefined) {
      return false;
    }

    if (highlightBlockIndex < startIndex || highlightBlockIndex > endIndex) {
      return false;
    }

    if (highlightBlockIndex === startIndex && highlight.endOffset <= input.annotation.startOffset) {
      return false;
    }

    if (highlightBlockIndex === endIndex && highlight.startOffset >= input.annotation.endOffset) {
      return false;
    }

    return true;
  });

  if (!overlappingHighlight) {
    return input.activeWordLists[0]?.name ?? null;
  }

  const matchedList = input.activeWordLists.find((wordList) =>
    wordList.entries.some((entry) => entry.term === overlappingHighlight.term),
  );

  return matchedList?.name ?? input.activeWordLists[0]?.name ?? null;
}

function buildSharedAnnotationListItem(input: {
  activeWordLists: SharedViewWordList[];
  annotation: SharedViewAnnotation;
  blocks: SharedViewBlock[];
  highlightMatches: SharedViewHighlightMatch[];
  token: string;
}) {
  const preview = buildAnnotationSourcePreview({
    annotation: input.annotation,
    blocks: input.blocks,
    contextCharacters: 42,
  });
  const title = truncateText(
    input.annotation.note.trim() || input.annotation.quote.trim() || "Untitled annotation",
    84,
  );
  const excerpt = preview.fullText.trim() || title;
  const typeLabel = getSharedAnnotationTypeLabel(input.annotation.tags);

  return {
    color: normalizeAnnotationColor(input.annotation.color),
    createdAt: input.annotation.createdAt,
    excerpt,
    id: input.annotation.id,
    preview,
    title,
    tone: getAnnotationColor(input.annotation.color),
    type: {
      label: typeLabel,
      value: normalizeTypeValue(typeLabel),
    },
    viewHref: `/shared/${input.token}?annotation=${input.annotation.id}`,
    wordListName: getSharedAnnotationWordListName({
      activeWordLists: input.activeWordLists,
      annotation: input.annotation,
      blocks: input.blocks,
      highlightMatches: input.highlightMatches,
    }),
  };
}

function buildJoinedAnnotationRange(
  annotation: SharedViewAnnotation,
  blocks: SharedViewBlock[],
) {
  const blockIndexByKey = new Map(
    blocks.map((block, index) => [block.blockKey, index] as const),
  );
  const startIndex = blockIndexByKey.get(annotation.startBlockKey);
  const endIndex = blockIndexByKey.get(annotation.endBlockKey);

  if (startIndex === undefined || endIndex === undefined || startIndex > endIndex) {
    return null;
  }

  let text = "";
  let highlightStart = -1;
  let highlightEnd = -1;

  for (let index = startIndex; index <= endIndex; index += 1) {
    const block = blocks[index];

    if (!block) {
      return null;
    }

    if (index > startIndex) {
      text += " ";
    }

    const blockTextStart = text.length;

    if (index === startIndex) {
      if (!isValidOffset(annotation.startOffset, block.text.length)) {
        return null;
      }

      highlightStart = blockTextStart + annotation.startOffset;
    }

    text += block.text;

    if (index === endIndex) {
      if (!isValidOffset(annotation.endOffset, block.text.length)) {
        return null;
      }

      highlightEnd = blockTextStart + annotation.endOffset;
    }
  }

  if (highlightStart < 0 || highlightEnd <= highlightStart) {
    return null;
  }

  return {
    highlightEnd,
    highlightStart,
    text,
  };
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];

  if (currentPage > 3) {
    items.push("ellipsis");
  }

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) {
    items.push("ellipsis");
  }

  items.push(totalPages);

  return items;
}

function buildTypeCounts(
  items: Array<ReturnType<typeof buildSharedAnnotationListItem>>,
) {
  const counts = new Map<
    string,
    {
      color: string;
      count: number;
      key: string;
      label: string;
    }
  >();

  for (const item of items) {
    const existing = counts.get(item.type.value);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(item.type.value, {
      color: item.tone.dot,
      count: 1,
      key: item.type.value,
      label: item.type.label,
    });
  }

  return [...counts.values()].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label),
  );
}

function clampPage(page: number, totalPages: number) {
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, totalPages);
}

function dedupeOptions(input: Array<{ label: string; value: string }>) {
  const seen = new Set<string>();

  return input.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });
}

function formatTypeLabel(value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return DEFAULT_ANNOTATION_TYPE_LABEL;
  }

  return normalizedValue
    .split(/[\s_-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function isValidOffset(value: number, maxLength: number) {
  return Number.isInteger(value) && value >= 0 && value <= maxLength;
}

function normalizeTypeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function truncateText(value: string, maxLength: number) {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 3)}...`;
}
