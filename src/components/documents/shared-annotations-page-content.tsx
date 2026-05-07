import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, Lock } from "lucide-react";
import { SharedAnnotationsFilterBar } from "@/components/annotations/shared-annotations-filter-bar";
import {
  buildSharedAnnotationsIndexData,
  type SharedViewAnnotation,
  type SharedViewBlock,
  type SharedViewHighlightMatch,
  type SharedViewWordList,
} from "@/lib/annotations/shared-view";
import { formatLongDateLabel, formatShortTimeLabel } from "@/lib/documents/metrics";

export function SharedAnnotationsPageContent({
  activeWordLists,
  annotations,
  blocks,
  color = "all",
  highlightMatches,
  originalName,
  page = 1,
  q = "",
  readingMinutes,
  sharedBy,
  sharedOn,
  sort = "newest",
  title,
  token,
  totalWords,
  type = "all",
  wordList = "all",
}: {
  activeWordLists: SharedViewWordList[];
  annotations: SharedViewAnnotation[];
  blocks: SharedViewBlock[];
  color?: string;
  highlightMatches: SharedViewHighlightMatch[];
  originalName: string;
  page?: number;
  q?: string;
  readingMinutes: number;
  sharedBy: string;
  sharedOn: Date;
  sort?: string;
  title: string;
  token: string;
  totalWords: number;
  type?: string;
  wordList?: string;
}) {
  const dashboardData = buildSharedAnnotationsIndexData({
    activeWordLists,
    annotations,
    blocks,
    filters: {
      color,
      page,
      q,
      sort,
      type,
      wordList,
    },
    highlightMatches,
    token,
  });

  return (
    <section className="px-11 py-9">
      <div>
        <h1 className="text-[54px] font-semibold tracking-[-0.06em] text-[#111827]">
          Annotations in this document
        </h1>
        <p className="mt-3 text-[18px] text-[#667085]">
          A read-only list of annotations from this shared article.
        </p>
      </div>

      <div className="mt-8 rounded-[16px] border border-[#E8EBF0] bg-white px-5 py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EEF4FF] text-[#2563EB]">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-semibold text-[#111827]">{title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-[15px] text-[#6B7280]">
                <span>Shared by {sharedBy}</span>
                <span>•</span>
                <span>{formatLongDateLabel(sharedOn)}</span>
                <span>•</span>
                <span>{totalWords.toLocaleString()} words</span>
                <span>•</span>
                <span>{readingMinutes} min read</span>
              </p>
            </div>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151]"
            href={`/shared/${token}`}
          >
            Back to document
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-[#DDEAFE] bg-[#F5F9FF] px-5 py-5">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F1FF] text-[#2563EB]">
            <Lock className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[#374151]">
              You&apos;re in read-only shared view
            </p>
            <p className="mt-2 text-[14px] leading-7 text-[#6B7280]">
              These annotations are from a shared document. You can view and explore, but cannot edit or add annotations.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SharedAnnotationsFilterBar
          color={color}
          colors={dashboardData.colorOptions}
          q={q}
          sort={sort}
          type={type}
          types={dashboardData.typeOptions}
          wordList={wordList}
          wordLists={dashboardData.wordListOptions}
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[274px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[16px] border border-[#E8EBF0] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-[#111827]">About this shared document</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#667085]">
              You&apos;re viewing annotations from a read-only shared document.
            </p>
            <div className="mt-5 rounded-[14px] border border-[#E5E7EB] bg-[#FBFCFE] px-4 py-4">
              <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
              <dl className="mt-4 space-y-3 text-[14px] text-[#667085]">
                <MetadataItem label="Shared by" value={sharedBy} />
                <MetadataItem label="Shared on" value={formatLongDateLabel(sharedOn)} />
                <MetadataItem label="Words" value={totalWords.toLocaleString()} />
                <MetadataItem label="Reading time" value={`${readingMinutes} min`} />
              </dl>
            </div>
          </section>

          <section className="rounded-[16px] border border-[#E8EBF0] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-[#111827]">Annotations summary</h2>
            <p className="mt-5 text-[15px] text-[#667085]">Total annotations</p>
            <p className="mt-2 text-[48px] font-semibold tracking-[-0.04em] text-[#111827]">
              {dashboardData.totalCount}
            </p>
            <div className="mt-5 space-y-4 border-t border-[#EEF2F6] pt-5">
              {dashboardData.typeCounts.map((count) => (
                <div className="flex items-center justify-between gap-3" key={count.key}>
                  <span className="flex items-center gap-3 text-[15px] text-[#4B5563]">
                    <span
                      className="inline-flex h-4 w-4 rounded-full"
                      style={{ backgroundColor: count.color }}
                    />
                    {count.label}
                  </span>
                  <span className="text-[15px] text-[#4B5563]">{count.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[16px] border border-[#DDEAFE] bg-[#F5F9FF] p-5">
            <h2 className="text-[15px] font-semibold text-[#111827]">Read-only shared view</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#667085]">
              You can browse all annotations from this document, but cannot edit or create annotations.
            </p>
            <p className="mt-5 text-[14px] font-medium text-[#2563EB]">Learn more →</p>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[16px] border border-[#E8EBF0] bg-white">
          <table className="min-w-full divide-y divide-[#EEF2F6] text-left">
            <thead className="bg-[#FBFCFE] text-[14px] font-medium text-[#667085]">
              <tr>
                <th className="px-5 py-4">Annotation</th>
                <th className="px-4 py-4">Word list</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {dashboardData.items.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-[15px] text-[#667085]" colSpan={5}>
                    No annotations matched this view.
                  </td>
                </tr>
              ) : null}
              {dashboardData.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-5 align-top">
                    <div className="flex gap-4">
                      <span
                        className="mt-2 inline-flex h-4 w-4 flex-none rounded-full"
                        style={{ backgroundColor: item.tone.dot }}
                      />
                      <div className="min-w-0">
                        <p className="text-[16px] font-medium text-[#111827]">{item.title}</p>
                        <p className="mt-2 text-[14px] leading-7 text-[#667085]">
                          {item.preview.hasLeadingEllipsis ? <span>...</span> : null}
                          {item.preview.beforeText}
                          <mark
                            className="rounded-[6px] px-1 py-0.5"
                            style={{
                              backgroundColor: item.tone.background,
                              color: item.tone.foreground,
                            }}
                          >
                            {item.preview.highlightText}
                          </mark>
                          {item.preview.afterText}
                          {item.preview.hasTrailingEllipsis ? <span>...</span> : null}
                        </p>
                        <p className="mt-3 text-[14px] text-[#98A2B3]">{originalName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top">
                    {item.wordListName ? (
                      <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[13px] font-medium text-[#2563EB]">
                        {item.wordListName}
                      </span>
                    ) : (
                      <span className="text-[15px] text-[#98A2B3]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-5 align-top">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-[13px] font-medium"
                      style={{
                        backgroundColor: item.tone.background,
                        color: item.tone.foreground,
                      }}
                    >
                      {item.type.label}
                    </span>
                  </td>
                  <td className="px-4 py-5 align-top text-[15px] text-[#667085]">
                    <p>{formatLongDateLabel(item.createdAt)}</p>
                    <p className="mt-1">{formatShortTimeLabel(item.createdAt)}</p>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151]"
                      href={item.viewHref}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {dashboardData.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 border-t border-[#EEF2F6] px-6 py-4">
              <PaginationLink
                ariaLabel="Previous page"
                disabled={dashboardData.currentPage === 1}
                href={buildPageHref({
                  color,
                  page: dashboardData.currentPage - 1,
                  q,
                  sort,
                  token,
                  type,
                  wordList,
                })}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </PaginationLink>
              {dashboardData.paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span className="px-3 text-[15px] text-[#667085]" key={`ellipsis-${index}`}>
                    ...
                  </span>
                ) : (
                  <PaginationLink
                    active={item === dashboardData.currentPage}
                    ariaLabel={`Page ${item}`}
                    href={buildPageHref({
                      color,
                      page: item,
                      q,
                      sort,
                      token,
                      type,
                      wordList,
                    })}
                    key={item}
                  >
                    {item}
                  </PaginationLink>
                ),
              )}
              <PaginationLink
                ariaLabel="Next page"
                disabled={dashboardData.currentPage === dashboardData.totalPages}
                href={buildPageHref({
                  color,
                  page: dashboardData.currentPage + 1,
                  q,
                  sort,
                  token,
                  type,
                  wordList,
                })}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </PaginationLink>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function buildPageHref(input: {
  color: string;
  page: number;
  q: string;
  sort: string;
  token: string;
  type: string;
  wordList: string;
}) {
  const params = new URLSearchParams();

  if (input.q.trim().length > 0) {
    params.set("q", input.q.trim());
  }

  if (input.color !== "all") {
    params.set("color", input.color);
  }

  if (input.type !== "all") {
    params.set("type", input.type);
  }

  if (input.wordList !== "all") {
    params.set("wordList", input.wordList);
  }

  if (input.sort !== "newest") {
    params.set("sort", input.sort);
  }

  if (input.page > 1) {
    params.set("page", input.page.toString());
  }

  const query = params.toString();

  return query.length > 0
    ? `/shared/${input.token}/annotations?${query}`
    : `/shared/${input.token}/annotations`;
}

function MetadataItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

function PaginationLink({
  active = false,
  ariaLabel,
  children,
  disabled = false,
  href,
}: {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  href: string;
}) {
  const className = `inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border px-3 text-[15px] ${
    active
      ? "border-[#BFDBFE] bg-[#EEF4FF] text-[#2563EB]"
      : "border-[#E5E7EB] bg-white text-[#4B5563]"
  } ${disabled ? "pointer-events-none opacity-50" : ""}`;

  return (
    <Link aria-label={ariaLabel} className={className} href={href}>
      {children}
    </Link>
  );
}
