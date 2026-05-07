"use client";

import Link from "next/link";
import { CalendarDays, Clock3, FileText, Lock, PencilLine, ShieldCheck, Tag, Type, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AnnotationPanel } from "@/components/documents/annotation-panel";
import {
  type ReaderBlock,
  type ReaderHighlightMatch,
  DocumentReader,
} from "@/components/documents/document-reader";
import {
  buildAnnotationSourcePreview,
  getSharedAnnotationTypeLabel,
  getSharedAnnotationWordListName,
  type SharedViewAnnotation,
  type SharedViewWordList,
} from "@/lib/annotations/shared-view";
import { getAnnotationColor } from "@/lib/annotations/presentation";
import { formatLongDateLabel, formatShortTimeLabel } from "@/lib/documents/metrics";

type SharedDocumentShellProps = {
  activeWordLists: SharedViewWordList[];
  annotations: SharedViewAnnotation[];
  blocks: ReaderBlock[];
  createdAt: Date;
  highlightMatches: ReaderHighlightMatch[];
  initialSelectedAnnotationId?: string | null;
  originalName: string;
  ownerInitials: string;
  ownerLabel: string;
  readingMinutes: number;
  title: string;
  token: string;
  updatedAt: Date;
  wordCount: number;
};

export function SharedDocumentShell({
  activeWordLists,
  annotations,
  blocks,
  createdAt,
  highlightMatches,
  initialSelectedAnnotationId = null,
  originalName,
  ownerInitials,
  ownerLabel,
  readingMinutes,
  title,
  token,
  updatedAt,
  wordCount,
}: SharedDocumentShellProps) {
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(
    initialSelectedAnnotationId,
  );
  const selectedAnnotation = selectedAnnotationId
    ? annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null
    : null;
  const metadataItems = [
    { icon: CalendarDays, label: "Created", value: formatLongDateLabel(createdAt) },
    { icon: PencilLine, label: "Last edited", value: formatLongDateLabel(updatedAt) },
    { icon: Type, label: "Words", value: wordCount.toLocaleString() },
    { icon: Clock3, label: "Reading time", value: `${readingMinutes} min` },
  ];

  return (
    <>
      <div className="grid gap-6 px-10 py-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="rounded-[20px] border border-[#E8EBF0] bg-white p-7">
            <div className="min-w-0">
              <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">{title}</h1>
              <p className="mt-4 flex flex-wrap items-center gap-3 text-[18px] text-[#6B7280]">
                <span>Shared by {ownerLabel}</span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F8F4] text-[14px] font-medium text-[#5E6B6B]">
                  {ownerInitials}
                </span>
                <span>•</span>
                <span>{formatLongDateLabel(updatedAt)}</span>
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-y-3 text-[16px] text-[#6B7280]">
                {metadataItems.map((item, index) => (
                  <div className="flex items-center" key={item.label}>
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2} />
                      <span>{item.label}</span>
                      <span className="font-medium text-[#111827]">{item.value}</span>
                    </div>
                    {index < metadataItems.length - 1 ? (
                      <span className="mx-5 text-[#9CA3AF]">•</span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-[16px] border border-[#DDEAFE] bg-[#F5F9FF] px-5 py-5">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F1FF] text-[#2563EB]">
                    <Lock className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#374151]">
                      This is a read-only shared document.
                    </p>
                    <p className="mt-2 text-[14px] leading-7 text-[#6B7280]">
                      You can view highlights and annotations, but cannot edit this document.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <DocumentReader
              activeAnnotationId={selectedAnnotationId}
              annotations={annotations}
              blocks={blocks}
              footer={undefined}
              highlightMatches={highlightMatches}
              onSelectAnnotation={(annotationId) => setSelectedAnnotationId(annotationId)}
              showTitle={false}
              title={title}
            />
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-[16px] border border-[#E8EBF0] bg-white px-5 py-4 text-[14px] text-[#6B7280] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" strokeWidth={2} />
              Shared view
            </div>
            <p>You are viewing a read-only shared document.</p>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#DCE5F3] px-4 text-[14px] font-medium text-[#3B82F6]"
              href="/documents"
            >
              Open in eng-copilot
            </Link>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[18px] border border-[#E8EBF0] bg-white p-5">
            <h2 className="text-[16px] font-semibold text-[#111827]">Active Word Lists</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#6B7280]">
              Words in this document are highlighted using the following lists.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeWordLists.length > 0 ? (
                activeWordLists.map((wordList) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6] bg-[#3B82F6] px-3 py-1.5 text-[13px] font-medium text-white"
                    key={wordList.id}
                  >
                    {wordList.name}
                    <span className="text-[10px]">●</span>
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
              About word lists
              <span>→</span>
            </Link>
          </section>

          <section className="rounded-[18px] border border-[#E8EBF0] bg-white p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3B82F6]">
              <ShieldCheck className="h-8 w-8" strokeWidth={2} />
            </div>
            <h2 className="mt-5 text-[16px] font-semibold text-[#111827]">Securely shared with you</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#6B7280]">
              This document is shared via a read-only link. Only authenticated viewers with the link can access it.
            </p>
            <button className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-[#3B82F6]" type="button">
              Learn more
              <span>→</span>
            </button>
          </section>

          <AnnotationPanel
            annotations={annotations.slice(0, 3)}
            onSelectAnnotation={(annotationId) => setSelectedAnnotationId(annotationId)}
            readOnly
            selectedAnnotationId={selectedAnnotationId}
            variant="compact"
            viewAllHref={`/shared/${token}/annotations`}
          />
        </aside>
      </div>

      {selectedAnnotation ? (
        <SharedAnnotationDialog
          activeWordLists={activeWordLists}
          annotation={selectedAnnotation}
          blocks={blocks}
          highlightMatches={highlightMatches}
          onClose={() => setSelectedAnnotationId(null)}
          originalName={originalName}
          token={token}
        />
      ) : null}
    </>
  );
}

function SharedAnnotationDialog({
  activeWordLists,
  annotation,
  blocks,
  highlightMatches,
  onClose,
  originalName,
  token,
}: {
  activeWordLists: SharedViewWordList[];
  annotation: SharedViewAnnotation;
  blocks: ReaderBlock[];
  highlightMatches: ReaderHighlightMatch[];
  onClose: () => void;
  originalName: string;
  token: string;
}) {
  const sourcePreview = buildAnnotationSourcePreview({
    annotation,
    blocks,
    contextCharacters: 48,
  });
  const tone = getAnnotationColor(annotation.color);
  const typeLabel = getSharedAnnotationTypeLabel(annotation.tags);
  const wordListName = getSharedAnnotationWordListName({
    activeWordLists,
    annotation,
    blocks,
    highlightMatches,
  });

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/28 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[686px] rounded-[24px] border border-[#E8EBF0] bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
        onClick={(event) => event.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F6] pb-5">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: tone.dot }}
            />
            <h2 className="text-[16px] font-semibold text-[#111827]">Annotation</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[14px] font-medium text-[#6B7280]">
              <Lock className="h-4 w-4" strokeWidth={2} />
              Read-only
            </span>
            <button
              aria-label="Close annotation dialog"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="space-y-6 py-5">
          <section>
            <p className="text-[14px] font-medium text-[#6B7280]">Source in document</p>
            <div className="mt-3 rounded-[16px] border border-[#E5E7EB] bg-[#FBFCFE] px-4 py-4 text-[16px] leading-8 text-[#374151]">
              <p>
                <span className="mr-2 text-[28px] leading-none text-[#9CA3AF]">&ldquo;</span>
                {sourcePreview.hasLeadingEllipsis ? <span>...</span> : null}
                {sourcePreview.beforeText}
                <mark
                  className="rounded-[8px] px-1.5 py-0.5"
                  style={{
                    backgroundColor: tone.background,
                    color: tone.foreground,
                  }}
                >
                  {sourcePreview.highlightText}
                </mark>
                {sourcePreview.afterText}
                {sourcePreview.hasTrailingEllipsis ? <span>...</span> : null}
                <span className="ml-2 text-[28px] leading-none text-[#9CA3AF]">&rdquo;</span>
              </p>
            </div>
          </section>

          <section>
            <p className="text-[14px] font-medium text-[#6B7280]">Annotation note</p>
            <div
              className="mt-3 rounded-[16px] border px-4 py-4 text-[16px] leading-8"
              style={{
                backgroundColor: tone.background,
                borderColor: tone.ring,
                color: tone.foreground,
              }}
            >
              <p>{annotation.note.trim() || annotation.quote.trim() || "No annotation note."}</p>
            </div>
          </section>

          <dl className="divide-y divide-[#EEF2F6] rounded-[16px] border border-[#EEF2F6]">
            <MetadataRow icon={FileText} label="Document" value={originalName} />
            <MetadataRow
              icon={CalendarDays}
              label="Created"
              value={`${formatLongDateLabel(annotation.createdAt)} at ${formatShortTimeLabel(annotation.createdAt)}`}
            />
            <MetadataRow
              icon={Tag}
              label="Type / Color"
              value={
                <span
                  className="inline-flex rounded-full px-3 py-1 text-[13px] font-medium"
                  style={{
                    backgroundColor: tone.background,
                    color: tone.foreground,
                  }}
                >
                  {typeLabel}
                </span>
              }
            />
            <MetadataRow
              icon={Tag}
              label="Word list"
              value={
                wordListName ? (
                  <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[13px] font-medium text-[#2563EB]">
                    {wordListName}
                  </span>
                ) : (
                  <span className="text-[15px] text-[#9CA3AF]">-</span>
                )
              }
            />
          </dl>
        </div>

        <div className="flex items-center justify-between border-t border-[#EEF2F6] pt-5">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#3B82F6]"
            href={`/shared/${token}/annotations`}
          >
            View all annotations
          </Link>
          <button
            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151]"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <dt className="flex items-center gap-3 text-[14px] text-[#6B7280]">
        <Icon className="h-4 w-4 text-[#9CA3AF]" strokeWidth={2} />
        {label}
      </dt>
      <dd className="text-right text-[15px] font-medium text-[#374151]">{value}</dd>
    </div>
  );
}
