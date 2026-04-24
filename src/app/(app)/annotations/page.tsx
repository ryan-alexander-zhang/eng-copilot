import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatLongDateLabel,
  formatShortTimeLabel,
} from "@/lib/documents/metrics";
import { buildAnnotationsDashboardData } from "@/lib/annotations/dashboard";
import { ANNOTATION_COLORS } from "@/lib/annotations/presentation";
import { AnnotationsFilterBar } from "@/components/annotations/annotations-filter-bar";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";

export default async function AnnotationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    color?: string;
    document?: string;
    page?: string;
    q?: string;
    sort?: string;
    type?: string;
    wordList?: string;
  }>;
}) {
  const session = await getRequiredSession();
  const resolvedSearchParams = await searchParams;
  const annotations = await prisma.annotation.findMany({
    where: {
      ownerId: session.user.id,
      document: {
        trashedAt: null,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      color: true,
      createdAt: true,
      endBlockKey: true,
      endOffset: true,
      note: true,
      quote: true,
      startBlockKey: true,
      startOffset: true,
      tags: true,
      updatedAt: true,
      document: {
        select: {
          id: true,
          title: true,
          originalName: true,
          highlightMatches: {
            select: {
              blockKey: true,
              startOffset: true,
              endOffset: true,
              term: true,
            },
          },
          activeLists: {
            select: {
              wordList: {
                select: {
                  name: true,
                  entries: {
                    select: {
                      term: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const dashboardData = buildAnnotationsDashboardData({
    annotations,
    filters: {
      color: resolvedSearchParams.color,
      document: resolvedSearchParams.document,
      page: getPageNumber(resolvedSearchParams.page),
      q: resolvedSearchParams.q,
      sort: resolvedSearchParams.sort,
      type: resolvedSearchParams.type,
      wordList: resolvedSearchParams.wordList,
    },
  });
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");
  const currentDocumentFilter = resolvedSearchParams.document ?? "all";
  const currentWordListFilter = resolvedSearchParams.wordList ?? "all";
  const currentTypeFilter = resolvedSearchParams.type ?? "all";
  const currentColorFilter = resolvedSearchParams.color ?? "all";
  const currentSort = resolvedSearchParams.sort ?? "newest";
  const currentQuery = resolvedSearchParams.q ?? "";

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="annotations" userInitial={userInitial} />

        <section className="px-11 py-9">
          <div>
            <h1 className="text-[54px] font-semibold tracking-[-0.06em] text-[#111827]">
              Annotations
            </h1>
            <p className="mt-3 text-[18px] text-[#667085]">
              All your annotations across documents. Click any annotation to view and edit.
            </p>
          </div>

          <div className="mt-8">
            <AnnotationsFilterBar
              color={currentColorFilter}
              colors={[
                { label: "All colors", value: "all" },
                ...ANNOTATION_COLORS.map((color) => ({
                  label: color.value[0].toUpperCase() + color.value.slice(1),
                  value: color.value,
                })),
              ]}
              document={currentDocumentFilter}
              documents={dashboardData.documents}
              q={currentQuery}
              sort={currentSort}
              type={currentTypeFilter}
              types={dashboardData.typeOptions}
              wordList={currentWordListFilter}
              wordLists={dashboardData.wordLists}
            />
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <section className="rounded-[16px] border border-[#E8EBF0] bg-white p-5">
                <p className="text-[15px] text-[#667085]">Total</p>
                <p className="mt-2 text-[48px] font-semibold tracking-[-0.04em] text-[#111827]">
                  {dashboardData.totalCount}
                </p>
                <div className="mt-5 border-t border-[#EEF2F6] pt-5">
                  <div className="space-y-4">
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
                </div>
              </section>

              <section className="rounded-[16px] border border-[#E8EBF0] bg-white p-5">
                <h2 className="text-[15px] font-semibold text-[#111827]">Recent documents</h2>
                <div className="mt-5 space-y-4">
                  {dashboardData.recentDocuments.map((document) => (
                    <Link
                      className="flex items-center justify-between gap-3 text-[15px] text-[#4B5563] transition hover:text-[#111827]"
                      href={document.href}
                      key={document.href}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 flex-none text-[#98A2B3]" strokeWidth={2} />
                        <span className="truncate">{document.documentName}</span>
                      </span>
                      <span>{document.count}</span>
                    </Link>
                  ))}
                </div>

                <Link
                  className="mt-7 inline-flex items-center gap-2 text-[15px] font-medium text-[#2563EB]"
                  href="/documents"
                >
                  View all documents
                  <span>→</span>
                </Link>
              </section>
            </aside>

            <section className="overflow-hidden rounded-[16px] border border-[#E8EBF0] bg-white">
              <table className="min-w-full divide-y divide-[#EEF2F6] text-left">
                <thead className="bg-[#FBFCFE] text-[14px] font-medium text-[#667085]">
                  <tr>
                    <th className="px-5 py-4">Annotation</th>
                    <th className="px-4 py-4">Document</th>
                    <th className="px-4 py-4">Word list</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Created at</th>
                    <th className="w-12 px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {dashboardData.items.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-[15px] text-[#667085]" colSpan={6}>
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
                            <Link
                              className="block text-[16px] font-medium text-[#111827] transition hover:text-[#2563EB]"
                              href={item.href}
                            >
                              {item.title}
                            </Link>
                            <p className="mt-3 text-[14px] leading-7 text-[#667085]">
                              <mark
                                className="rounded-[6px] px-1 py-0.5"
                                style={{
                                  backgroundColor: item.tone.background,
                                  color: item.tone.foreground,
                                }}
                              >
                                {item.excerpt}
                              </mark>
                            </p>
                            <p className="mt-3 text-[14px] text-[#667085]">
                              {item.documentName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 align-top text-[15px] text-[#667085]">
                        {item.documentName}
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
                        <button className="text-[#667085]" type="button">
                          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-center gap-2 border-t border-[#EEF2F6] px-6 py-4">
                <PaginationLink
                  ariaLabel="Previous page"
                  disabled={dashboardData.currentPage === 1}
                  href={buildPageHref(resolvedSearchParams, dashboardData.currentPage - 1)}
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
                      href={buildPageHref(resolvedSearchParams, item)}
                      key={item}
                    >
                      {item}
                    </PaginationLink>
                  ),
                )}
                <PaginationLink
                  ariaLabel="Next page"
                  disabled={dashboardData.currentPage === dashboardData.totalPages}
                  href={buildPageHref(resolvedSearchParams, dashboardData.currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </PaginationLink>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function getPageNumber(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function buildPageHref(
  searchParams: {
    color?: string;
    document?: string;
    page?: string;
    q?: string;
    sort?: string;
    type?: string;
    wordList?: string;
  },
  page: number,
) {
  const params = new URLSearchParams();

  if (searchParams.q) {
    params.set("q", searchParams.q);
  }

  if (searchParams.document) {
    params.set("document", searchParams.document);
  }

  if (searchParams.wordList) {
    params.set("wordList", searchParams.wordList);
  }

  if (searchParams.type) {
    params.set("type", searchParams.type);
  }

  if (searchParams.color) {
    params.set("color", searchParams.color);
  }

  if (searchParams.sort && searchParams.sort !== "newest") {
    params.set("sort", searchParams.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query.length > 0 ? `/annotations?${query}` : "/annotations";
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
  const className = `inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border px-3 text-[15px] ${
    active
      ? "border-[#BFDBFE] bg-[#F5F9FF] text-[#2563EB]"
      : "border-[#E5E7EB] bg-white text-[#667085]"
  }`;

  if (disabled) {
    return (
      <span aria-label={ariaLabel} className={`${className} opacity-45`}>
        {children}
      </span>
    );
  }

  return (
    <Link aria-label={ariaLabel} className={className} href={href}>
      {children}
    </Link>
  );
}
