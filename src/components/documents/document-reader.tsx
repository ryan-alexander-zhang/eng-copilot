"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { DocumentMarkdownPreview } from "@/components/documents/document-markdown-preview";
import type { ReaderSearchMatch } from "@/lib/documents/build-reader-search-matches";
import type { ProjectionBlock } from "@/lib/markdown/types";

export type ReaderBlock = ProjectionBlock;

export type ReaderHighlightMatch = {
  id?: string;
  blockKey: string;
  startOffset: number;
  endOffset: number;
  term: string;
};

export type ReaderAnnotation = {
  id: string;
  color?: string | null;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
};

type AnnotationSegment = {
  annotationId: string;
  color?: string | null;
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

type ToastState = {
  kind: "success" | "error";
  message: string;
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
  activeSearchMatchId,
  annotations,
  blocks,
  createAction,
  footer,
  highlightMatches,
  onCreateDraft,
  onSelectAnnotation,
  rawMarkdown,
  searchMatches = [],
  showTitle = true,
  title,
}: {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
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
  rawMarkdown?: string | null;
  searchMatches?: ReaderSearchMatch[];
  showTitle?: boolean;
  title?: string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialogDraft, setDialogDraft] = useState<AnnotationDraft | null>(null);
  const [isRawMarkdownOpen, setIsRawMarkdownOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const annotationSegments = buildAnnotationSegments({ blocks, annotations });
  const highlightMatchesByBlock = groupByBlock(highlightMatches);
  const searchMatchesByBlock = groupByBlock(searchMatches);
  const normalizedRawMarkdown = rawMarkdown ?? "";
  const hiddenFirstHeading =
    title &&
    blocks[0]?.kind === "heading" &&
    blocks[0].text.trim().toLowerCase() === title.trim().toLowerCase()
      ? blocks[0].blockKey
      : null;
  const hiddenBlockKeys = hiddenFirstHeading ? new Set([hiddenFirstHeading]) : undefined;
  const visibleBlockCount = blocks.length - (hiddenFirstHeading ? 1 : 0);

  useEffect(() => {
    if (!activeSearchMatchId) {
      return;
    }

    const activeSearchHit = [
      ...(previewRef.current?.querySelectorAll<HTMLElement>("[data-search-match-id]") ?? []),
    ].find((element) => element.dataset.searchMatchId === activeSearchMatchId);

    activeSearchHit?.scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeSearchMatchId]);

  useEffect(() => {
    if (!contextMenu && !dialogDraft && !isRawMarkdownOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
        setDialogDraft(null);
        setIsRawMarkdownOpen(false);
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
  }, [contextMenu, dialogDraft, isRawMarkdownOpen]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

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
        {title && showTitle ? (
          <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">{title}</h1>
        ) : null}
        {title && showTitle && visibleBlockCount > 0 ? <div className="mt-8" /> : null}
        {visibleBlockCount === 0 ? (
          <p className="text-[15px] text-[#6B7280]">No readable content.</p>
        ) : (
          <DocumentMarkdownPreview
            activeAnnotationId={activeAnnotationId}
            activeSearchMatchId={activeSearchMatchId}
            annotationSegmentsByBlock={annotationSegments}
            blocks={blocks}
            hiddenBlockKeys={hiddenBlockKeys}
            highlightMatchesByBlock={highlightMatchesByBlock}
            onSelectAnnotation={onSelectAnnotation}
            rawMarkdown={normalizedRawMarkdown}
            searchMatchesByBlock={searchMatchesByBlock}
          />
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
          {normalizedRawMarkdown.length > 0 ? (
            <button
              className="inline-flex items-center gap-2 text-[#4B5563]"
              onClick={() => setIsRawMarkdownOpen(true)}
              type="button"
            >
              <span>{"</>"}</span>
              Open raw Markdown
            </button>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence>
        {contextMenu ? (
          <SelectionContextMenu
            key="selection-menu"
            onAddToVocabulary={() => {
              const selectedQuote = contextMenu.draft.quote;

              void addToVocabulary(selectedQuote)
                .then(() => {
                  setToast({
                    kind: "success",
                    message: `Added "${truncateText(selectedQuote, 36)}" to vocabulary.`,
                  });
                })
                .catch((error) => {
                  setToast({
                    kind: "error",
                    message:
                      error instanceof Error && error.message.length > 0
                        ? error.message
                        : `Couldn't add "${truncateText(selectedQuote, 36)}" to vocabulary.`,
                  });
                });
              setContextMenu(null);
            }}
            onClose={() => setContextMenu(null)}
            onCopy={() => {
              void copyText(contextMenu.draft.quote);
              setContextMenu(null);
            }}
            onSearchWeb={() => {
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                contextMenu.draft.quote,
              )}`;

              window.open(searchUrl, "_blank", "noopener,noreferrer");
              setContextMenu(null);
            }}
            onSelect={() => {
              if (onCreateDraft) {
                onCreateDraft(contextMenu.draft);
                setContextMenu(null);
                return;
              }

              setDialogDraft(contextMenu.draft);
              setContextMenu(null);
            }}
            quote={contextMenu.draft.quote}
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

      <AnimatePresence>
        {isRawMarkdownOpen && normalizedRawMarkdown.length > 0 ? (
          <RawMarkdownDialog
            content={normalizedRawMarkdown}
            key="raw-markdown-dialog"
            onClose={() => setIsRawMarkdownOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? <ToastNotice key="reader-toast" kind={toast.kind} message={toast.message} /> : null}
      </AnimatePresence>
    </section>
  );
}

export const DocumentPreview = DocumentReader;

function SelectionContextMenu({
  onAddToVocabulary,
  onCopy,
  quote,
  onSearchWeb,
  x,
  y,
  onSelect,
  onClose,
}: {
  onAddToVocabulary: () => void;
  onCopy: () => void;
  quote: string;
  onSearchWeb: () => void;
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
        <p className="px-3 py-2 text-[12px] text-[#6B7280]">{`Look up "${truncateText(quote, 34)}"`}</p>
        <button
          className="flex w-full items-center justify-between rounded-[12px] bg-[#F5F9FF] px-4 py-3 text-left text-[14px] font-medium text-[#2563EB] transition hover:bg-[#EEF4FF]"
          onClick={onSelect}
          type="button"
        >
          <span>Add annotation</span>
          <span className="text-[#9CA3AF]">›</span>
        </button>
        <button
          className="flex w-full items-center rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]"
          onClick={onAddToVocabulary}
          type="button"
        >
          Add to vocabulary
        </button>
        <button
          className="flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]"
          onClick={onCopy}
          type="button"
        >
          <span>Copy</span>
          <span className="text-[#9CA3AF]">⌘C</span>
        </button>
        <button
          className="flex w-full items-center rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]"
          onClick={onSearchWeb}
          type="button"
        >
          Search the web
        </button>
        <button className="flex w-full items-center rounded-[12px] px-4 py-3 text-left text-[14px] text-[#4B5563] transition hover:bg-[#F9FAFB]" type="button">
          Inspect
        </button>
      </motion.div>
    </>
  );
}

function ToastNotice({
  kind,
  message,
}: {
  kind: "success" | "error";
  message: string;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      aria-live={kind === "error" ? "assertive" : "polite"}
      className="pointer-events-none fixed right-6 top-6 z-70 max-w-sm rounded-[16px] border px-4 py-3 shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
      initial={{ opacity: 0, y: -10 }}
      role={kind === "error" ? "alert" : "status"}
      style={{
        backgroundColor: kind === "error" ? "#FEF2F2" : "#ECFDF3",
        borderColor: kind === "error" ? "#FECACA" : "#A7F3D0",
        color: kind === "error" ? "#B42318" : "#027A48",
      }}
    >
      <p className="text-[14px] font-medium leading-6">{message}</p>
    </motion.div>
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

function RawMarkdownDialog({
  content,
  onClose,
}: {
  content: string;
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
        aria-label="Raw Markdown"
        aria-modal="true"
        className="w-full max-w-3xl rounded-[24px] border border-[#E8EBF0] bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[18px] font-semibold text-[#111827]">Raw Markdown</h2>
          <button
            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151]"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <pre className="mt-5 overflow-x-auto rounded-[16px] border border-[#E5E7EB] bg-[#111827] px-5 py-4 text-[14px] leading-7 text-[#F9FAFB]">
          <code>{content}</code>
        </pre>
      </motion.div>
    </motion.div>
  );
}
function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
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

async function copyText(value: string) {
  await navigator.clipboard?.writeText(value);
}

async function addToVocabulary(word: string) {
  const response = await fetch("/api/vocabulary", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      word,
    }),
  });

  if (response.ok) {
    return;
  }

  let errorMessage = `Couldn't add "${truncateText(word, 36)}" to vocabulary.`;

  try {
    const payload = (await response.json()) as { error?: unknown };

    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      errorMessage = payload.error;
    }
  } catch {
    // Keep the fallback message when the API does not return JSON.
  }

  throw new Error(errorMessage);
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

function isValidRange(offset: number, textLength: number) {
  return Number.isInteger(offset) && offset >= 0 && offset <= textLength;
}
