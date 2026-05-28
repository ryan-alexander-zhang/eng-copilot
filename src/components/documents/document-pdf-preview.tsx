"use client";

import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAnnotationColor } from "@/lib/annotations/presentation";
import type { BlockRun } from "@/lib/markdown/build-block-runs";
import { buildBlockRuns } from "@/lib/markdown/build-block-runs";
import type {
  PdfAnnotationAnchor,
  PdfAnnotationRect,
  ProjectionBlock,
} from "@/lib/markdown/types";
import {
  buildPdfPageText,
  type BuiltPdfPageText,
} from "@/lib/pdf/build-pdf-page-text";
import { loadPdfJsClient } from "@/lib/pdf/load-pdfjs-client";

type AnnotationSegment = {
  annotationId: string;
  color?: string | null;
  startOffset: number;
  endOffset: number;
};

type SearchMatch = {
  id: string;
  blockKey: string;
  startOffset: number;
  endOffset: number;
};

type HighlightMatch = {
  blockKey: string;
  startOffset: number;
  endOffset: number;
  term: string;
};

type PreviewAnnotation = {
  id: string;
  color?: string | null;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
  anchorData?: PdfAnnotationAnchor | null;
};

type RuntimePdfPage = {
  block: ProjectionBlock;
  page: PdfPageLike;
  pageNumber: number;
  pageText: BuiltPdfPageText;
  textContent: PdfTextContentLike;
  viewport: PdfViewportLike;
};

type PdfPageLike = {
  getTextContent: () => Promise<PdfTextContentLike>;
  getViewport: (params: { scale: number }) => PdfViewportLike;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewportLike }) => {
    promise: Promise<void>;
    cancel?: () => void;
  };
  rotate: number;
};

type PdfTextContentLike = {
  items: Array<{
    str?: string;
    hasEOL?: boolean;
  }>;
  styles?: Record<string, unknown>;
  lang?: string | null;
};

type PdfViewportLike = {
  width: number;
  height: number;
};

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
};

type OverlayRect = PdfAnnotationRect & {
  key: string;
  annotationId?: string;
  color?: string | null;
  searchMatchId?: string;
  tone?: "active-search" | "search" | "highlight";
};

const PDF_TEXT_LAYER_STYLE: CSSProperties = {
  color: "transparent",
  cursor: "text",
  inset: 0,
  overflow: "hidden",
  position: "absolute",
  userSelect: "text",
  whiteSpace: "pre-wrap",
};

export function DocumentPdfPreview({
  activeAnnotationId,
  activeSearchMatchId,
  annotationSegmentsByBlock,
  annotations,
  blocks,
  highlightMatchesByBlock,
  onSelectAnnotation,
  pdfSourceUrl,
  searchMatchesByBlock,
}: {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
  annotationSegmentsByBlock: Record<string, AnnotationSegment[]>;
  annotations: PreviewAnnotation[];
  blocks: ProjectionBlock[];
  highlightMatchesByBlock: Record<string, HighlightMatch[]>;
  onSelectAnnotation?: (annotationId: string) => void;
  pdfSourceUrl: string;
  searchMatchesByBlock: Record<string, SearchMatch[]>;
}) {
  const [pages, setPages] = useState<RuntimePdfPage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const blocksByPageNumber = useMemo(() => buildBlocksByPageNumber(blocks), [blocks]);
  const annotationsById = useMemo(
    () => new Map(annotations.map((annotation) => [annotation.id, annotation] as const)),
    [annotations],
  );

  useEffect(() => {
    let cancelled = false;
    let loadingTask: {
      destroy?: () => Promise<void> | void;
      promise: Promise<unknown>;
    } | null = null;

    async function loadPages() {
      setErrorMessage(null);

      try {
        const pdfjs = await loadPdfJsClient();
        const nextLoadingTask = pdfjs.getDocument({
          url: pdfSourceUrl,
          withCredentials: true,
          stopAtErrors: true,
        });
        loadingTask = nextLoadingTask;
        const document = (await nextLoadingTask.promise) as unknown as PdfDocumentLike;
        const nextPages: RuntimePdfPage[] = [];

        for (let pageIndex = 0; pageIndex < document.numPages; pageIndex += 1) {
          const pageNumber = pageIndex + 1;
          const page = await document.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = resolvePageScale(baseViewport.width);
          const viewport = page.getViewport({ scale });
          const textContent = await page.getTextContent();
          const pageText = buildPdfPageText(
            textContent.items.filter(isPdfTextItem),
          );
          const block = blocksByPageNumber.get(pageNumber);

          if (!block) {
            continue;
          }

          nextPages.push({
            block,
            page,
            pageNumber,
            pageText,
            textContent,
            viewport,
          });
        }

        if (!cancelled) {
          setPages(nextPages);
        }
      } catch (error) {
        if (!cancelled) {
          setPages([]);
          setErrorMessage(
            error instanceof Error
              ? error.message || "Unable to render this PDF."
              : "Unable to render this PDF.",
          );
        }
      }
    }

    void loadPages();

    return () => {
      cancelled = true;
      void loadingTask?.destroy?.();
    };
  }, [blocksByPageNumber, pdfSourceUrl]);

  if (errorMessage) {
    return <p className="text-[15px] text-[#B42318]">{errorMessage}</p>;
  }

  if (pages.length === 0) {
    return <p className="text-[15px] text-[#6B7280]">Preparing PDF…</p>;
  }

  return (
    <div className="space-y-8 overflow-x-auto">
      {pages.map((page) => (
        <PdfPageSurface
          activeAnnotationId={activeAnnotationId}
          activeSearchMatchId={activeSearchMatchId}
          annotationSegments={annotationSegmentsByBlock[page.block.blockKey] ?? []}
          annotationsById={annotationsById}
          block={page.block}
          highlightMatches={highlightMatchesByBlock[page.block.blockKey] ?? []}
          key={page.block.blockKey}
          onSelectAnnotation={onSelectAnnotation}
          page={page}
          searchMatches={searchMatchesByBlock[page.block.blockKey] ?? []}
        />
      ))}
    </div>
  );
}

function PdfPageSurface({
  activeAnnotationId,
  activeSearchMatchId,
  annotationSegments,
  annotationsById,
  block,
  highlightMatches,
  onSelectAnnotation,
  page,
  searchMatches,
}: {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
  annotationSegments: AnnotationSegment[];
  annotationsById: Map<string, PreviewAnnotation>;
  block: ProjectionBlock;
  highlightMatches: HighlightMatch[];
  onSelectAnnotation?: (annotationId: string) => void;
  page: RuntimePdfPage;
  searchMatches: SearchMatch[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const textDivsRef = useRef<HTMLElement[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const [highlightRects, setHighlightRects] = useState<OverlayRect[]>([]);
  const [searchRects, setSearchRects] = useState<OverlayRect[]>([]);
  const [annotationRects, setAnnotationRects] = useState<OverlayRect[]>([]);

  const blockRuns = useMemo(
    () =>
      buildBlockRuns({
        textLength: block.text.length,
        highlightMatches,
        annotationSegments,
        searchMatches,
      }),
    [annotationSegments, block, highlightMatches, searchMatches],
  );

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel?: () => void; promise: Promise<void> } | null = null;
    let textLayerInstance: {
      cancel?: () => void;
      render: () => Promise<void>;
      textDivs: HTMLElement[];
    } | null = null;

    async function renderPage() {
      const canvas = canvasRef.current;
      const textLayerContainer = textLayerRef.current;

      if (!canvas || !textLayerContainer) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      setIsRendered(false);
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(page.viewport.width * outputScale);
      canvas.height = Math.floor(page.viewport.height * outputScale);
      canvas.style.width = `${Math.floor(page.viewport.width)}px`;
      canvas.style.height = `${Math.floor(page.viewport.height)}px`;
      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      renderTask = page.page.render({
        canvasContext: context,
        viewport: page.viewport,
      });

      const pdfjs = await loadPdfJsClient();
      textLayerContainer.replaceChildren();
      textLayerInstance = new pdfjs.TextLayer({
        container: textLayerContainer,
        textContentSource: page.textContent as never,
        viewport: page.viewport as never,
      });

      await Promise.all([renderTask.promise, textLayerInstance.render()]);

      if (cancelled) {
        return;
      }

      textDivsRef.current = [...textLayerInstance.textDivs];
      decorateTextLayer({
        blockKey: block.blockKey,
        blockRuns,
        items: page.pageText.items,
        pageNumber: page.pageNumber,
        textDivs: textDivsRef.current,
        textLayerContainer,
      });
      setIsRendered(true);
    }

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
      textLayerInstance?.cancel?.();
    };
  }, [block.blockKey, blockRuns, page.page, page.pageText.items, page.pageText.text, page.pageText.runs, page.pageText.textItemCount, page.pageText.nonWhitespaceChars, page.pageNumber, page.textContent, page.viewport]);

  useEffect(() => {
    if (!isRendered || !pageRef.current || !textLayerRef.current) {
      return;
    }

    decorateTextLayer({
      blockKey: block.blockKey,
      blockRuns,
      items: page.pageText.items,
      pageNumber: page.pageNumber,
      textDivs: textDivsRef.current,
      textLayerContainer: textLayerRef.current,
    });

    setHighlightRects(
      buildMatchRects({
        pageNumber: page.pageNumber,
        pageRoot: pageRef.current,
        ranges: highlightMatches.map((match) => ({
          endOffset: match.endOffset,
          id: `${match.blockKey}:${match.startOffset}-${match.endOffset}:${match.term}`,
          startOffset: match.startOffset,
          tone: "highlight" as const,
        })),
      }),
    );
    setSearchRects(
      buildMatchRects({
        pageNumber: page.pageNumber,
        pageRoot: pageRef.current,
        ranges: searchMatches.map((match) => ({
          endOffset: match.endOffset,
          id: match.id,
          startOffset: match.startOffset,
          tone: activeSearchMatchId === match.id ? "active-search" : ("search" as const),
        })),
      }),
    );
    setAnnotationRects(
      buildAnnotationRects({
        annotationsById,
        blockKey: block.blockKey,
        blockTextLength: block.text.length,
        pageNumber: page.pageNumber,
        pageRoot: pageRef.current,
      }),
    );
  }, [
    activeAnnotationId,
    activeSearchMatchId,
    annotationsById,
    block.blockKey,
    block.text.length,
    blockRuns,
    highlightMatches,
    isRendered,
    page.pageNumber,
    page.pageText.items,
    searchMatches,
  ]);

  function handlePageClick(event: MouseEvent<HTMLDivElement>) {
    if (!pageRef.current || !onSelectAnnotation) {
      return;
    }

    const pageRect = pageRef.current.getBoundingClientRect();
    const x = event.clientX - pageRect.left;
    const y = event.clientY - pageRect.top;
    const targetRect = annotationRects.find(
      (rect) =>
        rect.annotationId &&
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height,
    );

    if (!targetRect?.annotationId) {
      return;
    }

    onSelectAnnotation(targetRect.annotationId);
  }

  return (
    <div className="rounded-[18px] border border-[#E8EBF0] bg-[#F8FAFC] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.16em] text-[#9CA3AF]">
        Page {page.pageNumber}
      </p>
      <div
        className="relative mx-auto bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
        data-pdf-page-number={page.pageNumber}
        onClick={handlePageClick}
        ref={pageRef}
        style={{
          height: page.viewport.height,
          width: page.viewport.width,
        }}
      >
        <canvas ref={canvasRef} />
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {highlightRects.map((rect) => (
            <PageOverlayRect key={rect.key} rect={rect} />
          ))}
          {searchRects.map((rect) => (
            <PageOverlayRect key={rect.key} rect={rect} />
          ))}
        </div>
        <div
          className="pdf-text-layer"
          ref={textLayerRef}
          style={PDF_TEXT_LAYER_STYLE}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {annotationRects.map((rect) => (
            <AnnotationOverlayRect
              activeAnnotationId={activeAnnotationId}
              key={rect.key}
              rect={rect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PageOverlayRect({ rect }: { rect: OverlayRect }) {
  const style: CSSProperties = {
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    position: "absolute",
    borderRadius: 6,
  };

  if (rect.tone === "active-search") {
    style.backgroundColor = "#FDE68A";
    style.boxShadow = "inset 0 0 0 1px #F59E0B";
  } else if (rect.tone === "search") {
    style.backgroundColor = "#FEF3C7";
  } else {
    style.backgroundColor = "#EAF3FF";
  }

  return (
    <div
      data-overlay-tone={rect.tone}
      data-search-match-id={rect.searchMatchId}
      style={style}
    />
  );
}

function AnnotationOverlayRect({
  activeAnnotationId,
  rect,
}: {
  activeAnnotationId?: string | null;
  rect: OverlayRect;
}) {
  const color = getAnnotationColor(rect.color);
  const isActive = !!activeAnnotationId && rect.annotationId === activeAnnotationId;

  return (
    <div
      className="absolute rounded-[6px] transition"
      data-annotation-id={rect.annotationId}
      style={{
        backgroundColor: isActive ? color.activeBackground : color.background,
        boxShadow: isActive
          ? `inset 0 0 0 1px ${color.activeRing}`
          : `inset 0 0 0 1px ${color.ring}`,
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

function buildBlocksByPageNumber(blocks: ProjectionBlock[]) {
  const blocksByPageNumber = new Map<number, ProjectionBlock>();

  for (const block of blocks) {
    const pageNumber = block.attrs?.pageNumber;

    if (block.kind !== "pdf-page" || !Number.isInteger(pageNumber)) {
      continue;
    }

    blocksByPageNumber.set(Number(pageNumber), block);
  }

  return blocksByPageNumber;
}

function resolvePageScale(width: number) {
  const targetWidth = 860;
  const scaledWidth = Math.min(targetWidth / width, 1.45);

  return Number.isFinite(scaledWidth) && scaledWidth > 0 ? scaledWidth : 1;
}

function isPdfTextItem(item: unknown): item is { str: string; hasEOL?: boolean } {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof item.str === "string"
  );
}

function decorateTextLayer(input: {
  blockKey: string;
  blockRuns: BlockRun[];
  items: BuiltPdfPageText["items"];
  pageNumber: number;
  textDivs: HTMLElement[];
  textLayerContainer: HTMLDivElement;
}) {
  const fragment = document.createDocumentFragment();

  for (const item of input.items) {
    const textDiv = input.textDivs[item.itemIndex];

    if (!textDiv) {
      continue;
    }

    textDiv.replaceChildren();
    textDiv.setAttribute("data-block-key", input.blockKey);
    textDiv.dataset.pageNumber = input.pageNumber.toString();
    textDiv.style.color = "transparent";
    textDiv.style.cursor = "text";
    textDiv.style.userSelect = "text";

    if (item.runIndex !== null && item.text.length > 0) {
      const overlappingRuns = input.blockRuns.filter(
        (run) => run.startOffset < item.endOffset && item.startOffset < run.endOffset,
      );

      for (const run of overlappingRuns) {
        const sliceStart = Math.max(item.startOffset, run.startOffset);
        const sliceEnd = Math.min(item.endOffset, run.endOffset);
        const sliceText = item.text.slice(
          sliceStart - item.startOffset,
          sliceEnd - item.startOffset,
        );

        if (sliceText.length === 0) {
          continue;
        }

        const span = document.createElement("span");
        span.textContent = sliceText;
        span.dataset.blockKey = input.blockKey;
        span.dataset.pageNumber = input.pageNumber.toString();
        span.dataset.runIndex = item.runIndex.toString();
        span.dataset.sliceStart = sliceStart.toString();
        span.dataset.sliceEnd = sliceEnd.toString();

        if (run.searchMatchIds[0]) {
          span.dataset.searchMatchId = run.searchMatchIds[0];
        }

        textDiv.append(span);
      }
    }

    fragment.append(textDiv);

    if (item.hasEOL) {
      fragment.append(document.createElement("br"));
    }
  }

  input.textLayerContainer.replaceChildren(fragment);
}

function buildMatchRects(input: {
  pageNumber: number;
  pageRoot: HTMLDivElement;
  ranges: Array<{
    id: string;
    startOffset: number;
    endOffset: number;
    tone: "active-search" | "search" | "highlight";
  }>;
}) {
  return input.ranges.flatMap((range, rangeIndex) => {
    const domRange = buildRangeFromOffsets({
      endOffset: range.endOffset,
      pageRoot: input.pageRoot,
      startOffset: range.startOffset,
    });

    if (!domRange) {
      return [];
    }

    return rangeToOverlayRects({
      annotationId: undefined,
      color: null,
      keyPrefix: `${range.id}:${rangeIndex}`,
      pageNumber: input.pageNumber,
      pageRoot: input.pageRoot,
      range: domRange,
      searchMatchId: range.tone === "highlight" ? undefined : range.id,
      tone: range.tone,
    });
  });
}

function buildAnnotationRects(input: {
  annotationsById: Map<string, PreviewAnnotation>;
  blockKey: string;
  blockTextLength: number;
  pageNumber: number;
  pageRoot: HTMLDivElement;
}) {
  const overlays: OverlayRect[] = [];

  for (const annotation of input.annotationsById.values()) {
    if (
      annotation.startBlockKey !== input.blockKey &&
      annotation.endBlockKey !== input.blockKey &&
      !annotation.anchorData?.rects.some((rect) => rect.pageNumber === input.pageNumber)
    ) {
      continue;
    }

    const rects =
      getPersistedAnnotationRects({
        anchorData: annotation.anchorData,
        pageNumber: input.pageNumber,
      }) ??
      buildMatchRects({
        pageNumber: input.pageNumber,
        pageRoot: input.pageRoot,
        ranges: [
          {
            endOffset:
              annotation.endBlockKey === input.blockKey
                ? annotation.endOffset
                : input.blockTextLength,
            id: annotation.id,
            startOffset:
              annotation.startBlockKey === input.blockKey ? annotation.startOffset : 0,
            tone: "highlight",
          },
        ],
      }).map((rect) => ({
        ...rect,
        tone: undefined,
      }));

    overlays.push(
      ...rects.map((rect, index) => ({
        ...rect,
        annotationId: annotation.id,
        color: annotation.color,
        key: `${annotation.id}:${index}`,
      })),
    );
  }

  return overlays;
}

function getPersistedAnnotationRects(input: {
  anchorData?: PdfAnnotationAnchor | null;
  pageNumber: number;
}) {
  if (!input.anchorData || input.anchorData.kind !== "pdf-page-text-v1") {
    return null;
  }

  const rects = input.anchorData.rects.filter((rect) => rect.pageNumber === input.pageNumber);

  return rects.length > 0
    ? rects.map((rect, index) => ({
        ...rect,
        key: `${rect.pageNumber}:${index}`,
      }))
    : null;
}

function buildRangeFromOffsets(input: {
  endOffset: number;
  pageRoot: HTMLDivElement;
  startOffset: number;
}) {
  const sliceSpans = [
    ...input.pageRoot.querySelectorAll<HTMLElement>("[data-slice-start][data-slice-end]"),
  ].filter((span) => {
    const spanStart = Number(span.dataset.sliceStart);
    const spanEnd = Number(span.dataset.sliceEnd);

    return !Number.isNaN(spanStart) && !Number.isNaN(spanEnd) && spanStart < input.endOffset && input.startOffset < spanEnd;
  });

  if (sliceSpans.length === 0) {
    return null;
  }

  const startSpan = sliceSpans[0];
  const endSpan = sliceSpans.at(-1);
  const startSpanStart = Number(startSpan?.dataset.sliceStart);
  const endSpanStart = Number(endSpan?.dataset.sliceStart);
  const startTextNode = startSpan?.firstChild;
  const endTextNode = endSpan?.firstChild;

  if (
    !startSpan ||
    !endSpan ||
    !startTextNode ||
    !endTextNode ||
    Number.isNaN(startSpanStart) ||
    Number.isNaN(endSpanStart)
  ) {
    return null;
  }

  const range = document.createRange();
  const startTextLength = startTextNode.textContent?.length ?? 0;
  const endTextLength = endTextNode.textContent?.length ?? 0;

  range.setStart(
    startTextNode,
    Math.min(Math.max(0, input.startOffset - startSpanStart), startTextLength),
  );
  range.setEnd(
    endTextNode,
    Math.min(Math.max(0, input.endOffset - endSpanStart), endTextLength),
  );

  return range;
}

function rangeToOverlayRects(input: {
  annotationId?: string;
  color?: string | null;
  keyPrefix: string;
  pageNumber: number;
  pageRoot: HTMLDivElement;
  range: Range;
  searchMatchId?: string;
  tone?: "active-search" | "search" | "highlight";
}) {
  const rootRect = input.pageRoot.getBoundingClientRect();

  return [...input.range.getClientRects()]
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect, index) => ({
      annotationId: input.annotationId,
      color: input.color,
      height: rect.height,
      key: `${input.keyPrefix}:${index}`,
      pageNumber: input.pageNumber,
      searchMatchId: index === 0 ? input.searchMatchId : undefined,
      tone: input.tone,
      width: rect.width,
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
    }));
}
