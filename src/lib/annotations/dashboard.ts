import { getAnnotationColor, normalizeAnnotationColor } from "@/lib/annotations/presentation";

export const DEFAULT_ANNOTATION_TYPE_LABEL = "Untagged";

type DashboardAnnotation = {
  color: string;
  createdAt: Date;
  document: {
    activeLists: Array<{
      wordList: {
        entries: Array<{
          term: string;
        }>;
        name: string;
      };
    }>;
    highlightMatches: Array<{
      blockKey: string;
      endOffset: number;
      startOffset: number;
      term: string;
    }>;
    id: string;
    originalName: string;
    title: string;
  };
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

type DashboardFilters = {
  color?: string;
  document?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  type?: string;
  wordList?: string;
};

export function buildAnnotationsDashboardData(input: {
  annotations: DashboardAnnotation[];
  filters: DashboardFilters;
}) {
  const items = input.annotations.map((annotation) => buildDashboardItem(annotation));
  const documents = dedupeOptions(
    items.map((item) => ({
      label: item.documentName,
      value: item.documentId,
    })),
  );
  const wordLists = dedupeOptions(
    items
      .filter((item) => item.wordListName)
      .map((item) => ({
        label: item.wordListName as string,
        value: item.wordListName as string,
      })),
  );
  const filteredItems = items.filter((item) => {
    const query = input.filters.q?.trim().toLowerCase() ?? "";

    if (
      query.length > 0 &&
      ![
        item.documentName,
        item.documentTitle,
        item.excerpt,
        item.title,
        item.type.label,
        item.wordListName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (input.filters.document && input.filters.document !== "all" && item.documentId !== input.filters.document) {
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
    currentPage,
    documents,
    items: pageItems,
    paginationItems: buildPaginationItems(currentPage, totalPages),
    recentDocuments: buildRecentDocuments(items),
    totalCount: items.length,
    totalPages,
    typeCounts: buildTypeCounts(items),
    typeOptions: dedupeOptions(
      items.map((item) => ({
        label: item.type.label,
        value: item.type.value,
      })),
    ),
    wordLists,
  };
}

function buildDashboardItem(annotation: DashboardAnnotation) {
  const color = normalizeAnnotationColor(annotation.color);
  const excerpt = truncateText(annotation.quote || annotation.note || "No preview available.", 92);
  const wordListName = findMatchingWordListName(annotation);
  const typeLabel = formatTypeLabel(annotation.tags[0] ?? DEFAULT_ANNOTATION_TYPE_LABEL);

  return {
    color,
    createdAt: annotation.createdAt,
    documentId: annotation.document.id,
    documentName: annotation.document.originalName,
    documentTitle: annotation.document.title,
    excerpt,
    href: `/documents/${annotation.document.id}?annotation=${annotation.id}`,
    id: annotation.id,
    title: truncateText(annotation.note || annotation.quote || "Untitled annotation", 84),
    tone: getAnnotationColor(annotation.color),
    type: {
      label: typeLabel,
      value: normalizeTypeValue(typeLabel),
    },
    updatedAt: annotation.updatedAt,
    wordListName,
  };
}

function findMatchingWordListName(annotation: DashboardAnnotation) {
  const overlappingHighlight = annotation.document.highlightMatches.find((highlight) => {
    if (highlight.blockKey !== annotation.startBlockKey || highlight.blockKey !== annotation.endBlockKey) {
      return false;
    }

    return highlight.startOffset < annotation.endOffset && highlight.endOffset > annotation.startOffset;
  });

  if (overlappingHighlight) {
    const matchedList = annotation.document.activeLists.find((list) =>
      list.wordList.entries.some((entry) => entry.term === overlappingHighlight.term),
    );

    if (matchedList) {
      return matchedList.wordList.name;
    }
  }

  return annotation.document.activeLists[0]?.wordList.name ?? null;
}

function buildRecentDocuments(
  items: Array<ReturnType<typeof buildDashboardItem>>,
) {
  const countsByDocument = new Map<
    string,
    {
      count: number;
      documentName: string;
      documentTitle: string;
      href: string;
    }
  >();

  for (const item of items) {
    const existing = countsByDocument.get(item.documentId);

    if (existing) {
      existing.count += 1;
      continue;
    }

    countsByDocument.set(item.documentId, {
      count: 1,
      documentName: item.documentName,
      documentTitle: item.documentTitle,
      href: `/documents/${item.documentId}`,
    });
  }

  return [...countsByDocument.values()]
    .sort((left, right) => right.count - left.count || left.documentTitle.localeCompare(right.documentTitle))
    .slice(0, 5);
}

function buildTypeCounts(items: Array<ReturnType<typeof buildDashboardItem>>) {
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

function clampPage(page: number, totalPages: number) {
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, totalPages);
}

function truncateText(value: string, maxLength: number) {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 3)}...`;
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

function normalizeTypeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}
