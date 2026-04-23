"use client";

import Link from "next/link";
import {
  BookOpen,
  BookOpenText,
  Check,
  ChevronDown,
  Link2,
  List,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AnnotationEditorPanel } from "@/components/documents/annotation-editor-panel";
import { AnnotationPanel } from "@/components/documents/annotation-panel";
import {
  type AnnotationDraft,
  type ReaderAnnotation,
  type ReaderBlock,
  type ReaderHighlightMatch,
  DocumentReader,
} from "@/components/documents/document-reader";
import { formatCompactNumber } from "@/lib/documents/metrics";

type WorkspaceAnnotation = ReaderAnnotation & {
  createdAt: Date;
  note: string;
  quote: string;
  tags: string[];
  updatedAt: Date;
};

export function DocumentWorkspace({
  annotations,
  blocks,
  createAction,
  deleteAction,
  enableShareAction,
  highlightMatches,
  matchedWords,
  readingMinutes,
  revokeShareAction,
  share,
  title,
  updateAction,
  updatedLabel,
  wordLists,
  wordCount,
}: {
  annotations: WorkspaceAnnotation[];
  blocks: ReaderBlock[];
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  enableShareAction: () => Promise<void>;
  highlightMatches: ReaderHighlightMatch[];
  matchedWords: Array<{
    count: number;
    listName: string | null;
    term: string;
  }>;
  readingMinutes: number;
  revokeShareAction: () => Promise<void>;
  share: {
    isActive: boolean;
    token: string;
  } | null;
  title: string;
  updateAction: (formData: FormData) => Promise<void>;
  updatedLabel: string;
  wordLists: Array<{
    id: string;
    isSelected: boolean;
    name: string;
  }>;
  wordCount: number;
}) {
  const [editorState, setEditorState] = useState<
    | {
        draft: AnnotationDraft;
        mode: "create";
      }
    | {
        annotationId: string;
        mode: "edit";
      }
    | null
  >(null);
  const selectedAnnotation =
    editorState?.mode === "edit"
      ? annotations.find((annotation) => annotation.id === editorState.annotationId) ?? null
      : null;
  const selectedAnnotationId = selectedAnnotation?.id ?? null;
  const uniqueMatchedWordCount = useMemo(
    () => new Set(matchedWords.map((match) => match.term)).size,
    [matchedWords],
  );

  return (
    <section className="flex min-w-0 flex-1">
      <div className="min-w-0 flex-1 px-7 py-6">
        <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#E8EBF0] bg-white px-4 py-3">
          <button className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151]" type="button">
            <BookOpen className="h-4 w-4" strokeWidth={2} />
            Reading
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>

          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
            <input
              className="h-10 w-full rounded-[12px] border border-[#E5E7EB] bg-white pl-11 pr-12 text-[14px] text-[#111827] outline-none"
              placeholder="Search in document..."
              type="search"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF]">
              ⌘K
            </span>
          </div>

          <div className="inline-flex rounded-[12px] border border-[#E5E7EB] bg-white p-1">
            <button className="inline-flex h-8 w-9 items-center justify-center rounded-[10px] bg-[#EEF4FF] text-[#2563EB]" type="button">
              <BookOpen className="h-4 w-4" strokeWidth={2} />
            </button>
            <button className="inline-flex h-8 w-9 items-center justify-center rounded-[10px] text-[#6B7280]" type="button">
              <List className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <form action={share?.isActive ? revokeShareAction : enableShareAction}>
            <button className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151]" type="submit">
              <Link2 className="h-4 w-4" strokeWidth={2} />
              Share read-only
            </button>
          </form>

          <button className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[#6B7280]" type="button">
            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-6">
          <DocumentReader
            activeAnnotationId={selectedAnnotationId}
            annotations={annotations}
            blocks={blocks}
            createAction={createAction}
            footer={{
              readingMinutes,
              updatedLabel,
              wordCount,
            }}
            highlightMatches={highlightMatches}
            onCreateDraft={(draft) => {
              setEditorState({
                draft,
                mode: "create",
              });
            }}
            onSelectAnnotation={(annotationId) => {
              setEditorState({
                annotationId,
                mode: "edit",
              });
            }}
            title={title}
          />
        </div>
      </div>

      {editorState ? (
        <AnnotationEditorPanel
          annotation={selectedAnnotation ?? undefined}
          createAction={createAction}
          deleteAction={deleteAction}
          draft={editorState.mode === "create" ? editorState.draft : undefined}
          mode={editorState.mode}
          onClose={() => setEditorState(null)}
          updateAction={updateAction}
        />
      ) : null}

      <aside className="w-full max-w-[300px] border-l border-[#E8EBF0] bg-[#FBFCFE] px-5 py-6">
        <section className="rounded-[18px] border border-[#E8EBF0] bg-white p-5">
          <h2 className="text-[16px] font-semibold text-[#111827]">Word Lists</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#6B7280]">
            Highlight words from your selected lists.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {wordLists.length > 0 ? (
              wordLists.map((wordList) => (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium ${
                    wordList.isSelected
                      ? "border-[#DCE8FF] bg-[#F5F9FF] text-[#3B82F6]"
                      : "border-[#E5E7EB] bg-white text-[#4B5563]"
                  }`}
                  key={wordList.id}
                >
                  {wordList.name}
                  {wordList.isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : null}
                </span>
              ))
            ) : (
              <span className="text-[14px] text-[#9CA3AF]">No active lists</span>
            )}
          </div>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-[#3B82F6]"
            href="/word-lists"
          >
            Manage word lists
            <span>→</span>
          </Link>
        </section>

        <section className="mt-5 rounded-[18px] border border-[#E8EBF0] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">Matched Words</h2>
            <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#6B7280]">
              {formatCompactNumber(uniqueMatchedWordCount)}
            </span>
          </div>
          <p className="mt-3 text-[14px] leading-7 text-[#6B7280]">
            Words in this document from selected lists.
          </p>
          <div className="mt-4 space-y-3">
            {matchedWords.length === 0 ? (
              <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 text-[14px] text-[#6B7280]">
                No matched words in this document.
              </div>
            ) : (
              matchedWords.map((match) => (
                <div className="flex items-center justify-between gap-3" key={match.term}>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#374151]">{match.term}</p>
                    {match.listName ? (
                      <span className="mt-1 inline-flex rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#3B82F6]">
                        {match.listName}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-[#9CA3AF]">
                    <span className="text-[13px]">{match.count}</span>
                    <BookOpenText className="h-4 w-4" strokeWidth={1.9} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mt-5">
          <AnnotationPanel
            annotations={editorState ? annotations : annotations.slice(0, 3)}
            onSelectAnnotation={(annotationId) => {
              setEditorState({
                annotationId,
                mode: "edit",
              });
            }}
            selectedAnnotationId={selectedAnnotationId}
            variant={editorState ? "detailed" : "compact"}
          />
        </div>
      </aside>
    </section>
  );
}
