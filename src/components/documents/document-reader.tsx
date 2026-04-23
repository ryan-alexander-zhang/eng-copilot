"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { getAnnotationColor } from "@/lib/annotations/presentation";

export type ReaderBlock = {
  blockKey: string;
  kind?: string;
  text: string;
};

export type ReaderHighlightMatch = {
  id?: string;
  blockKey: string;
  startOffset: number;
  endOffset: number;
  term: string;
};

export type ReaderAnnotation = {
  id: string;
  color?: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
};

type AnnotationSegment = {
  annotationId: string;
  color?: string;
  startOffset: number;
  endOffset: number;
};

export type AnnotationDraft = {
  quote: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
};

type SelectionPoint = {
  blockKey: string;
  offset: number;
};

type ContextMenuState = {
  draft: AnnotationDraft;
  x: number;
  y: number;
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
        color: annotation.color,
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
  activeAnnotationId,
  annotations,
  blocks,
  createAction,
  footer,
  highlightMatches,
  onCreateDraft,
  onSelectAnnotation,
  title,
}: {
  activeAnnotationId?: string | null;
  annotations: ReaderAnnotation[];
  blocks: ReaderBlock[];
  createAction?: (formData: FormData) => Promise<void>;
  footer?: {
    readingMinutes: number;
    updatedLabel: string;
    wordCount: number;
  };
  highlightMatches: ReaderHighlightMatch[];
  onCreateDraft?: (draft: AnnotationDraft) => void;
  onSelectAnnotation?: (annotationId: string) => void;
  title?: string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogDraft, setDialogDraft] = useState<AnnotationDraft | null>(null);
  const annotationSegments = buildAnnotationSegments({ blocks, annotations });
  const highlightMatchesByBlock = groupByBlock(highlightMatches);
  const renderedBlocks =
    title &&
    blocks[0]?.kind === "heading" &&
    blocks[0].text.trim().toLowerCase() === title.trim().toLowerCase()
      ? blocks.slice(1)
      : blocks;

  useEffect(() => {
    if (!contextMenu && !dialogDraft) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
        setDialogDraft(null);
      }
    }

    function handleWindowInteraction() {
      setContextMenu(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleWindowInteraction, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleWindowInteraction, true);
    };
  }, [contextMenu, dialogDraft]);

  function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (!createAction && !onCreateDraft) {
      return;
    }

    const draft = getSelectionDraft(previewRef.current);

    if (!draft) {
      return;
    }

    event.preventDefault();
    setDialogDraft(null);
    setContextMenu({
      draft,
      x: event.clientX,
      y: event.clientY,
    });
  }

  return (
    <section aria-label="Document reader" className="space-y-4">
      <div
        className="rounded-[20px] border border-[#E8EBF0] bg-white px-12 py-11"
        onContextMenu={handleContextMenu}
        ref={previewRef}
      >
        {title ? (
          <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">{title}</h1>
        ) : null}
        {title && renderedBlocks.length > 0 ? <div className="mt-8" /> : null}
        {renderedBlocks.length === 0 ? (
          <p className="text-[15px] text-[#6B7280]">No readable content.</p>
        ) : (
          renderedBlocks.map((block, index) => {
            const inlineContent = renderInlineContent({
              activeAnnotationId,
              annotationSegments: annotationSegments[block.blockKey] ?? [],
              blockKey: block.blockKey,
              highlightMatches: highlightMatchesByBlock[block.blockKey] ?? [],
              onSelectAnnotation,
              text: block.text,
            });
            const listItemIndex = getListItemIndex(renderedBlocks, index);

            switch (block.kind) {
              case "heading":
                return (
                  <h2
                    className="mt-10 text-[19px] font-semibold leading-9 text-[#111827]"
                    data-block-key={block.blockKey}
                    key={block.blockKey}
                  >
                    <span className="mr-2 text-[#111827]">##</span>
                    {inlineContent}
                  </h2>
                );
              case "list-item":
                return (
                  <p
                    className="mt-3 flex gap-4 text-[18px] leading-10 text-[#4B5563]"
                    data-block-key={block.blockKey}
                    key={block.blockKey}
                  >
                    <span className="min-w-5 text-[#6B7280]">{`${listItemIndex}. `}</span>
                    <span>{inlineContent}</span>
                  </p>
                );
              case "blockquote":
                return (
                  <blockquote
                    className="mt-8 border-l-[3px] border-[#E5E7EB] pl-6 text-[17px] italic leading-10 text-[#6B7280]"
                    data-block-key={block.blockKey}
                    key={block.blockKey}
                  >
                    {inlineContent}
                  </blockquote>
                );
              case "code":
                return (
                  <pre
                    className="mt-8 overflow-x-auto rounded-[16px] border border-[#E5E7EB] bg-[#111827] px-5 py-4 text-[14px] leading-7 text-[#F9FAFB]"
                    data-block-key={block.blockKey}
                    key={block.blockKey}
                  >
                    <code>{inlineContent}</code>
                  </pre>
                );
              default:
                return (
                  <p
                    className="mt-4 text-[18px] leading-10 text-[#4B5563]"
                    data-block-key={block.blockKey}
                    key={block.blockKey}
                  >
                    {inlineContent}
                  </p>
                );
            }
          })
        )}
      </div>

      {footer ? (
        <div className="flex flex-col gap-4 rounded-[16px] border border-[#E8EBF0] bg-white px-6 py-4 text-[14px] text-[#6B7280] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>{footer.wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>{footer.readingMinutes} min read</span>
            <span>•</span>
            <span>Last edited {footer.updatedLabel}</span>
          </div>
          <button className="inline-flex items-center gap-2 text-[#4B5563]" type="button">
            <span>{"</>"}</span>
            Open raw Markdown
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {contextMenu ? (
          <SelectionContextMenu
            key="selection-menu"
            onClose={() => setContextMenu(null)}
            onSelect={() => {
              if (onCreateDraft) {
                onCreateDraft(contextMenu.draft);
                setContextMenu(null);
                return;
              }

              setDialogDraft(contextMenu.draft);
              setContextMenu(null);
            }}
            x={contextMenu.x}
            y={contextMenu.y}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {dialogDraft && createAction ? (
          <CreateAnnotationDialog
            action={createAction}
            draft={dialogDraft}
            key="annotation-dialog"
            onClose={() => setDialogDraft(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export const DocumentPreview = DocumentReader;

function SelectionContextMenu({
  x,
  y,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <motion.button
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        initial={{ opacity: 0 }}
        onClick={onClose}
        type="button"
      />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed z-50 min-w-60 rounded-[16px] border border-[#E5E7EB] bg-white p-2 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        style={{ left: x, top: y }}
      >
        <p className="px-3 py-2 text-[12px] text-[#6B7280]">Look up selected text</p>
        <button
          className="flex w-full items-center justify-between rounded-[12px] bg-[#F5F9FF] px-4 py-3 text-left text-[14px] font-medium text-[#2563EB] transition hover:bg-[#EEF4FF]"
          onClick={onSelect}
          type="button"
        >
          <span>Add annotation</span>
          <span className="text-[#9CA3AF]">›</span>
        </button>
        <button className="flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]" type="button">
          <span>Copy</span>
          <span className="text-[#9CA3AF]">⌘C</span>
        </button>
        <button className="flex w-full items-center rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]" type="button">
          Search the web
        </button>
        <button className="flex w-full items-center rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]" type="button">
          Inspect
        </button>
      </motion.div>
    </>
  );
}

function CreateAnnotationDialog({
  action,
  draft,
  onClose,
}: {
  action: (formData: FormData) => Promise<void>;
  draft: AnnotationDraft;
  onClose: () => void;
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/35 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-xl rounded-[24px] border border-[#E8EBF0] bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
          New annotation
        </p>
        <div className="mt-4 rounded-[16px] border border-[#F6D89A] bg-[#FFF7E8] px-4 py-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#9CA3AF]">
            Selected text
          </p>
          <p className="mt-2 text-[16px] leading-8 text-[#3D2F0A]">&ldquo;{draft.quote}&rdquo;</p>
        </div>
        <form action={action} className="mt-5 space-y-4">
          <input name="startBlockKey" type="hidden" value={draft.startBlockKey} />
          <input name="startOffset" type="hidden" value={draft.startOffset.toString()} />
          <input name="endBlockKey" type="hidden" value={draft.endBlockKey} />
          <input name="endOffset" type="hidden" value={draft.endOffset.toString()} />
          <div className="space-y-2">
            <label className="field-label" htmlFor="annotation-note">
              Note
            </label>
            <textarea
              className="field-textarea"
              id="annotation-note"
              name="note"
              placeholder="Add a reminder, explanation, or translation..."
              rows={5}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="button-secondary justify-center" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button-primary justify-center" type="submit">
              Save annotation
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function renderInlineContent(input: {
  activeAnnotationId?: string | null;
  annotationSegments: AnnotationSegment[];
  blockKey: string;
  highlightMatches: ReaderHighlightMatch[];
  onSelectAnnotation?: (annotationId: string) => void;
  text: string;
}) {
  const slices = buildRenderSlices(input);

  if (slices.length === 0) {
    return input.text;
  }

  return slices.map((slice, index) => {
    const isInteractive = slice.annotationIds.length > 0 && !!input.onSelectAnnotation;

    return (
      <span
        className={`rounded-[8px] px-[0.2rem] py-[0.08rem] transition ${
          isInteractive ? "cursor-pointer" : ""
        }`}
        data-annotation-ids={
          slice.annotationIds.length > 0 ? slice.annotationIds.join(",") : undefined
        }
        data-block-key={input.blockKey}
        data-highlight-terms={
          slice.highlightTerms.length > 0 ? slice.highlightTerms.join(",") : undefined
        }
        data-slice-end={slice.endOffset}
        data-slice-start={slice.startOffset}
        key={`${slice.startOffset}-${slice.endOffset}-${index}`}
        onClick={
          isInteractive
            ? () => {
                input.onSelectAnnotation?.(slice.annotationIds[0]);
              }
            : undefined
        }
        style={buildSliceStyle(slice, input.activeAnnotationId)}
        title={buildSliceTitle(slice.highlightTerms, slice.annotationIds) ?? undefined}
      >
        {slice.text}
      </span>
    );
  });
}

function buildSliceStyle(
  slice: {
    highlightTerms: string[];
    annotationIds: string[];
    annotationColor?: string;
  },
  activeAnnotationId?: string | null,
): CSSProperties | undefined {
  if (slice.annotationIds.length > 0) {
    const isActive = !!activeAnnotationId && slice.annotationIds.includes(activeAnnotationId);
    const color = getAnnotationColor(slice.annotationColor);

    return {
      backgroundColor: isActive ? color.activeBackground : color.background,
      color: color.foreground,
      boxShadow: isActive
        ? `inset 0 0 0 1px ${color.activeRing}`
        : `inset 0 0 0 1px ${color.ring}`,
    };
  }

  if (slice.highlightTerms.length > 0) {
    return {
      backgroundColor: "#EAF3FF",
      color: "#2563EB",
    };
  }

  return undefined;
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
    annotationColor?: string;
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
      annotationColor: input.annotationSegments.find(
        (segment) => segment.startOffset <= startOffset && endOffset <= segment.endOffset,
      )?.color,
    });
  }

  return slices;
}

function getSelectionDraft(root: HTMLDivElement | null): AnnotationDraft | null {
  if (!root) {
    return null;
  }

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }

  const quote = selection.toString();

  if (quote.trim().length === 0) {
    return null;
  }

  const start = resolveSelectionPoint(range.startContainer, range.startOffset);
  const end = resolveSelectionPoint(range.endContainer, range.endOffset);

  if (!start || !end) {
    return null;
  }

  if (start.blockKey === end.blockKey && start.offset >= end.offset) {
    return null;
  }

  return {
    quote,
    startBlockKey: start.blockKey,
    startOffset: start.offset,
    endBlockKey: end.blockKey,
    endOffset: end.offset,
  };
}

function resolveSelectionPoint(node: Node, offset: number): SelectionPoint | null {
  const element = node instanceof Element ? node : node.parentElement;
  const slice = element?.closest<HTMLElement>("[data-slice-start]");

  if (!slice) {
    return null;
  }

  const blockKey = slice.dataset.blockKey;
  const sliceStart = Number(slice.dataset.sliceStart);
  const sliceEnd = Number(slice.dataset.sliceEnd);

  if (!blockKey || Number.isNaN(sliceStart) || Number.isNaN(sliceEnd)) {
    return null;
  }

  const localRange = document.createRange();

  localRange.selectNodeContents(slice);

  try {
    localRange.setEnd(node, offset);
  } catch {
    return null;
  }

  const localOffset = Math.min(
    Math.max(localRange.toString().length, 0),
    sliceEnd - sliceStart,
  );

  return {
    blockKey,
    offset: sliceStart + localOffset,
  };
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

function getListItemIndex(blocks: ReaderBlock[], index: number) {
  let count = 1;

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (blocks[cursor]?.kind !== "list-item") {
      break;
    }

    count += 1;
  }

  return count;
}
