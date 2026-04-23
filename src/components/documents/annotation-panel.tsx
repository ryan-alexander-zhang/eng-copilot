"use client";

import { PenLine } from "lucide-react";
import {
  formatLongDateLabel,
  formatRelativeDayLabel,
  formatShortTimeLabel,
} from "@/lib/documents/metrics";
import { getAnnotationColor } from "@/lib/annotations/presentation";

type AnnotationPanelAnnotation = {
  id: string;
  color?: string;
  quote: string;
  note: string;
  createdAt: Date;
  tags?: string[];
  updatedAt: Date;
};

export function AnnotationPanel({
  annotations,
  onSelectAnnotation,
  readOnly = false,
  selectedAnnotationId,
  variant = "detailed",
}: {
  annotations: AnnotationPanelAnnotation[];
  onSelectAnnotation?: (annotationId: string) => void;
  readOnly?: boolean;
  selectedAnnotationId?: string | null;
  variant?: "compact" | "detailed";
}) {
  return (
    <section className="rounded-[18px] border border-[#E8EBF0] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#111827]">Annotations</h2>
        <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#6B7280]">
          {annotations.length}
        </span>
      </div>

      {variant === "detailed" && !readOnly ? (
        <div className="mt-4 flex items-center gap-3">
          <select className="h-10 flex-1 appearance-none rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#374151]">
            <option>All annotations</option>
          </select>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[#6B7280]"
            type="button"
          >
            ≣
          </button>
        </div>
      ) : null}

      {annotations.length === 0 ? (
        <div className="mt-5 rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 text-[14px] text-[#6B7280]">
          No annotations yet.
        </div>
      ) : variant === "compact" ? (
        <div className="mt-5 space-y-4">
          {annotations.map((annotation, index) => {
            const previewText = annotation.note.trim().length > 0 ? annotation.note : annotation.quote;

            return (
              <CompactAnnotationCard
                annotation={annotation}
                key={annotation.id}
                onSelectAnnotation={onSelectAnnotation}
                previewText={previewText}
                showEllipsis={!readOnly}
                toneIndex={index}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {groupAnnotations(annotations).map((group) => (
            <div key={group.label}>
              <p className="text-[13px] font-medium text-[#9CA3AF]">{group.label}</p>
              <div className="mt-3 space-y-3">
                {group.items.map((annotation) => (
                  <DetailedAnnotationCard
                    annotation={annotation}
                    isReadOnly={readOnly}
                    isSelected={selectedAnnotationId === annotation.id}
                    key={annotation.id}
                    onSelectAnnotation={onSelectAnnotation}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[14px] font-medium text-[#3B82F6]"
        type="button"
      >
        View all annotations
      </button>
    </section>
  );
}

function CompactAnnotationCard({
  annotation,
  onSelectAnnotation,
  previewText,
  showEllipsis,
  toneIndex,
}: {
  annotation: AnnotationPanelAnnotation;
  onSelectAnnotation?: (annotationId: string) => void;
  previewText: string;
  showEllipsis: boolean;
  toneIndex: number;
}) {
  const colors = ["#4B8CFF", "#67C587", "#F5B73B"];
  const card = (
    <div className="flex items-start gap-3">
      <span
        className="mt-2 inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: colors[toneIndex % colors.length] }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-7 text-[#374151]">{previewText}</p>
        <p className="mt-2 text-[13px] text-[#9CA3AF]">{formatRelativeDayLabel(annotation.updatedAt)}</p>
      </div>
      {showEllipsis ? <span className="text-[#9CA3AF]">···</span> : null}
    </div>
  );

  if (!onSelectAnnotation) {
    return <div className="rounded-[14px] border border-[#E8EBF0] bg-white px-4 py-4">{card}</div>;
  }

  return (
    <button
      className="block w-full rounded-[14px] border border-[#E8EBF0] bg-white px-4 py-4 text-left transition hover:bg-[#FBFCFE]"
      onClick={() => onSelectAnnotation(annotation.id)}
      type="button"
    >
      {card}
    </button>
  );
}

function DetailedAnnotationCard({
  annotation,
  isReadOnly,
  isSelected,
  onSelectAnnotation,
}: {
  annotation: AnnotationPanelAnnotation;
  isReadOnly: boolean;
  isSelected: boolean;
  onSelectAnnotation?: (annotationId: string) => void;
}) {
  const color = getAnnotationColor(annotation.color);
  const content = (
    <div className="flex items-start gap-3">
      <span
        className="mt-2 inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color.dot }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-7 text-[#374151]">
          {annotation.quote.trim().length > 0 ? annotation.quote : annotation.note}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-[#9CA3AF]">
          <span>{formatAnnotationTimestamp(annotation.updatedAt)}</span>
          {!isReadOnly ? (
            <div className="flex items-center gap-3">
              {isSelected ? <PenLine className="h-3.5 w-3.5" strokeWidth={2.1} /> : null}
              <span>···</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
  const className = `block w-full rounded-[14px] border px-4 py-4 text-left transition ${
    isSelected
      ? "shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
      : "border-[#E8EBF0] bg-white hover:bg-[#FBFCFE]"
  }`;
  const style = isSelected
    ? {
        borderColor: color.dot,
        backgroundColor: color.background,
      }
    : undefined;

  if (!onSelectAnnotation) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      className={className}
      onClick={() => {
        onSelectAnnotation(annotation.id);
      }}
      style={style}
      type="button"
    >
      {content}
    </button>
  );
}

function groupAnnotations(annotations: AnnotationPanelAnnotation[]) {
  const groups = new Map<string, AnnotationPanelAnnotation[]>();

  for (const annotation of annotations) {
    const label = getGroupLabel(annotation.updatedAt);
    groups.set(label, [...(groups.get(label) ?? []), annotation]);
  }

  return [...groups.entries()].map(([label, items]) => ({
    label,
    items,
  }));
}

function getGroupLabel(date: Date) {
  const relativeLabel = formatRelativeDayLabel(date);

  if (relativeLabel === "Today" || relativeLabel === "Yesterday") {
    return relativeLabel;
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs <= 7 * 86400000) {
    return "This week";
  }

  return "Earlier";
}

function formatAnnotationTimestamp(date: Date) {
  const relativeLabel = formatRelativeDayLabel(date);

  if (relativeLabel === "Today") {
    return formatShortTimeLabel(date);
  }

  if (relativeLabel === "Yesterday") {
    return `Yesterday ${formatShortTimeLabel(date)}`;
  }

  return `${formatLongDateLabel(date)}, ${formatShortTimeLabel(date)}`;
}
