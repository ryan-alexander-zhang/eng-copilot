import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileSearch,
  Filter,
  FolderOpen,
  Link2,
  MessageSquareText,
  MoreHorizontal,
} from "lucide-react";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  countWords,
  formatCompactNumber,
  formatDateTimeLabel,
  formatStorageAmount,
} from "@/lib/documents/metrics";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";
import { DocumentUploadSidebar } from "@/components/layout/document-upload-sidebar";
import { LibraryNavSidebar } from "@/components/layout/library-nav-sidebar";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";

const PAGE_SIZE = 8;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    tab?: string;
  }>;
}) {
  const session = await getRequiredSession();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const activeTab = resolvedSearchParams.tab ?? "all";
  const sort = resolvedSearchParams.sort ?? "last-edited";
  const page = getPageNumber(resolvedSearchParams.page);
  const [documents, sharedWithMeCount] = await Promise.all([
    prisma.document.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        rawMarkdown: true,
        createdAt: true,
        updatedAt: true,
        share: {
          select: {
            token: true,
            isActive: true,
          },
        },
        activeLists: {
          select: {
            wordList: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            annotations: true,
          },
        },
      },
    }),
    prisma.documentShare.count({
      where: {
        isActive: true,
        document: {
          ownerId: {
            not: session.user.id,
          },
        },
      },
    }),
  ]);
  const documentsWithMetrics = documents.map((document) => ({
    ...document,
    summary: extractSummary(document.rawMarkdown),
    wordCount: countWords(document.rawMarkdown),
  }));
  const filteredDocuments = sortDocuments(
    documentsWithMetrics.filter((document) => {
      const matchesSearch =
        query.length === 0 ||
        document.title.toLowerCase().includes(query) ||
        document.originalName.toLowerCase().includes(query) ||
        document.summary.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      switch (activeTab) {
        case "recent":
          return document.updatedAt.getTime() >= Date.now() - 7 * 86400000;
        case "shared":
          return document.share?.isActive ?? false;
        case "annotated":
          return document._count.annotations > 0;
        default:
          return true;
      }
    }),
    sort,
  );
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const totalAnnotations = documentsWithMetrics.reduce(
    (sum, document) => sum + document._count.annotations,
    0,
  );
  const activeShareCount = documentsWithMetrics.filter((document) => document.share?.isActive).length;
  const usedWordListCount = documentsWithMetrics.filter(
    (document) => document.activeLists.length > 0,
  ).length;
  const trashCount = Math.max(0, documentsWithMetrics.length - 10);
  const storageBytes = documentsWithMetrics.reduce(
    (sum, document) => sum + Buffer.byteLength(document.rawMarkdown, "utf8"),
    0,
  );
  const storageTotalBytes = 10 * 1024 * 1024 * 1024;
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="documents" userInitial={userInitial} />

        <div className="flex min-h-[calc(100vh-72px)]">
          <aside className="w-full max-w-[296px] border-r border-[#E8EBF0] bg-white px-6 py-6">
            <DocumentUploadSidebar />
            <div className="mt-6">
              <LibraryNavSidebar
                activeItem="documents"
                counts={{
                  documents: documentsWithMetrics.length,
                  wordLists: usedWordListCount,
                  annotations: totalAnnotations,
                  sharedWithMe: sharedWithMeCount,
                  readOnlyLinks: activeShareCount,
                  trash: trashCount,
                }}
                storage={{
                  usedLabel: formatStorageAmount(storageBytes),
                  totalLabel: "10 GB",
                  progress: storageBytes / storageTotalBytes,
                }}
              />
            </div>
          </aside>

          <section className="min-w-0 flex-1 px-9 py-9">
            <div className="max-w-[1088px]">
              <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">
                Documents
              </h1>
              <p className="mt-3 text-[22px] leading-8 text-[#7B8594]">
                Manage your Markdown reading files, annotations, and sharing settings.
              </p>

              <div className="mt-8 grid gap-4 xl:grid-cols-4">
                <StatCard icon={<FolderOpen className="h-5 w-5" strokeWidth={2} />} label="Total documents" value={formatCompactNumber(documentsWithMetrics.length)} />
                <StatCard icon={<MessageSquareText className="h-5 w-5" strokeWidth={2} />} label="Total annotations" value={formatCompactNumber(totalAnnotations)} tint="green" />
                <StatCard icon={<Link2 className="h-5 w-5" strokeWidth={2} />} label="Read-only links active" value={formatCompactNumber(activeShareCount)} tint="purple" />
                <StatCard icon={<BookOpenCheck className="h-5 w-5" strokeWidth={2} />} label="Word lists used" value={formatCompactNumber(usedWordListCount)} tint="amber" />
              </div>

              <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center">
                  <form className="relative w-full max-w-[420px]" method="GET">
                    <input name="tab" type="hidden" value={activeTab} />
                    <input name="sort" type="hidden" value={sort} />
                    <FileSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
                    <input
                      className="h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white pl-11 pr-12 text-[14px] text-[#111827] outline-none transition focus:border-[#BFDBFE] focus:ring-4 focus:ring-[#DBEAFE]"
                      defaultValue={resolvedSearchParams.q ?? ""}
                      name="q"
                      placeholder="Search documents..."
                      type="search"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF]">
                      ⌘K
                    </span>
                  </form>

                  <div className="inline-flex rounded-[12px] border border-[#E5E7EB] bg-white p-1">
                    <TabLink active={activeTab === "all"} href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "all" })}>
                      All
                    </TabLink>
                    <TabLink active={activeTab === "recent"} href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "recent" })}>
                      Recent
                    </TabLink>
                    <TabLink active={activeTab === "shared"} href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "shared" })}>
                      Shared
                    </TabLink>
                    <TabLink active={activeTab === "annotated"} href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "annotated" })}>
                      Annotated
                    </TabLink>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#4B5563]"
                    type="button"
                  >
                    <Filter className="h-4 w-4" strokeWidth={2} />
                    Filter
                  </button>
                  <div className="relative">
                    <select
                      className="h-11 appearance-none rounded-[12px] border border-[#E5E7EB] bg-white pl-4 pr-10 text-[14px] font-medium text-[#4B5563] outline-none"
                      defaultValue={sort}
                      form="document-sort-form"
                      name="sort"
                    >
                      <option value="last-edited">Sort: Last edited</option>
                      <option value="created">Sort: Created</option>
                      <option value="title">Sort: Title</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
                    <form id="document-sort-form" method="GET">
                      <input name="q" type="hidden" value={resolvedSearchParams.q ?? ""} />
                      <input name="tab" type="hidden" value={activeTab} />
                    </form>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[18px] border border-[#E8EBF0]">
                <table className="min-w-full divide-y divide-[#E8EBF0] text-left">
                  <thead className="bg-[#FBFCFE] text-[13px] font-medium text-[#7B8594]">
                    <tr>
                      <th className="w-12 px-4 py-4">
                        <input className="h-4 w-4 rounded border-[#D0D5DD]" type="checkbox" />
                      </th>
                      <th className="px-4 py-4">Document</th>
                      <th className="px-4 py-4">Words</th>
                      <th className="px-4 py-4">Last edited</th>
                      <th className="px-4 py-4">Word lists</th>
                      <th className="px-4 py-4">Annotations</th>
                      <th className="px-4 py-4">Sharing</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF0] bg-white">
                    {pagedDocuments.length === 0 ? (
                      <tr>
                        <td className="px-6 py-14 text-center text-[15px] text-[#6B7280]" colSpan={8}>
                          No documents matched this view.
                        </td>
                      </tr>
                    ) : null}
                    {pagedDocuments.map((document) => (
                      <tr className="align-top" key={document.id}>
                        <td className="px-4 py-5">
                          <input className="mt-1 h-4 w-4 rounded border-[#D0D5DD]" type="checkbox" />
                        </td>
                        <td className="px-4 py-5">
                          <Link className="block" href={`/documents/${document.id}`}>
                            <p className="text-[16px] font-semibold text-[#111827]">{document.title}.md</p>
                            <p className="mt-1 max-w-[320px] text-[14px] leading-6 text-[#7B8594]">
                              {document.summary}
                            </p>
                          </Link>
                        </td>
                        <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                          {formatCompactNumber(document.wordCount)}
                        </td>
                        <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                          {formatDateTimeLabel(document.updatedAt)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-wrap gap-2">
                            {document.activeLists.length > 0 ? (
                              document.activeLists.slice(0, 2).map((wordList) => (
                                <span
                                  className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[12px] font-medium text-[#3B82F6]"
                                  key={`${document.id}-${wordList.wordList.name}`}
                                >
                                  {wordList.wordList.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[14px] text-[#9CA3AF]">-</span>
                            )}
                            {document.activeLists.length > 2 ? (
                              <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]">
                                +{document.activeLists.length - 2}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                          {document._count.annotations}
                        </td>
                        <td className="px-4 py-5">
                          {document.share?.isActive ? (
                            <span className="inline-flex items-center rounded-full bg-[#ECFDF3] px-3 py-1 text-[12px] font-medium text-[#027A48]">
                              Read-only link active
                            </span>
                          ) : (
                            <span className="text-[14px] text-[#9CA3AF]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-1 text-[#6B7280]">
                            <Link
                              aria-label={`Open ${document.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition hover:bg-[#F3F4F6]"
                              href={`/documents/${document.id}`}
                            >
                              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                            </Link>
                            <button
                              aria-label={`Copy ${document.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition hover:bg-[#F3F4F6]"
                              type="button"
                            >
                              <Copy className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <Link
                              aria-label={`Open shared view for ${document.title}`}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition ${
                                document.share?.isActive
                                  ? "hover:bg-[#F3F4F6]"
                                  : "pointer-events-none opacity-35"
                              }`}
                              href={document.share?.isActive ? `/shared/${document.share.token}` : "#"}
                            >
                              <Link2 className="h-4 w-4" strokeWidth={2} />
                            </Link>
                            <button
                              aria-label={`More actions for ${document.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition hover:bg-[#F3F4F6]"
                              type="button"
                            >
                              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-4 text-[14px] text-[#6B7280] xl:flex-row xl:items-center xl:justify-between">
                <p>
                  {filteredDocuments.length === 0
                    ? "0 documents"
                    : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
                        currentPage * PAGE_SIZE,
                        filteredDocuments.length,
                      )} of ${filteredDocuments.length} documents`}
                </p>

                <div className="flex items-center gap-3">
                  <PageButton disabled={currentPage === 1} href={buildQuery({ page: String(currentPage - 1), q: resolvedSearchParams.q, sort, tab: activeTab })}>
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </PageButton>
                  <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-[12px] border border-[#BFDBFE] bg-[#F5F9FF] px-3 text-[#2563EB]">
                    {currentPage}
                  </span>
                  <PageButton disabled={currentPage >= totalPages} href={buildQuery({ page: String(currentPage + 1), q: resolvedSearchParams.q, sort, tab: activeTab })}>
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </PageButton>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function extractSummary(rawMarkdown: string) {
  const summary = rawMarkdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("#"))
    .map((line) => line.replace(/^[>*\-\d.\s]+/, "").trim())
    .find((line) => line.length > 0);

  if (!summary) {
    return "No summary available.";
  }

  return summary.length > 78 ? `${summary.slice(0, 75)}...` : summary;
}

function sortDocuments<
  T extends {
    createdAt: Date;
    title: string;
    updatedAt: Date;
  },
>(documents: T[], sort: string) {
  return [...documents].sort((left, right) => {
    switch (sort) {
      case "created":
        return right.createdAt.getTime() - left.createdAt.getTime();
      case "title":
        return left.title.localeCompare(right.title);
      default:
        return right.updatedAt.getTime() - left.updatedAt.getTime();
    }
  });
}

function getPageNumber(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildQuery(input: {
  page?: string;
  q?: string;
  sort?: string;
  tab?: string;
}) {
  const params = new URLSearchParams();

  if (input.page && input.page !== "1") {
    params.set("page", input.page);
  }

  if (input.q) {
    params.set("q", input.q);
  }

  if (input.sort && input.sort !== "last-edited") {
    params.set("sort", input.sort);
  }

  if (input.tab && input.tab !== "all") {
    params.set("tab", input.tab);
  }

  const query = params.toString();

  return query.length > 0 ? `/documents?${query}` : "/documents";
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function StatCard({
  icon,
  label,
  value,
  tint = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tint?: "amber" | "blue" | "green" | "purple";
}) {
  const iconClassName =
    tint === "green"
      ? "bg-[#ECFDF3] text-[#12B76A]"
      : tint === "purple"
        ? "bg-[#F4F0FF] text-[#9E77ED]"
        : tint === "amber"
          ? "bg-[#FFFAEB] text-[#EAAA08]"
          : "bg-[#EEF4FF] text-[#3B82F6]";

  return (
    <article className="rounded-[18px] border border-[#E8EBF0] bg-white p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${iconClassName}`}>
        {icon}
      </div>
      <p className="mt-5 text-[38px] font-semibold tracking-[-0.04em] text-[#111827]">{value}</p>
      <p className="mt-1 text-[15px] text-[#7B8594]">{label}</p>
    </article>
  );
}

function TabLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: string;
  href: string;
}) {
  return (
    <Link
      className={`inline-flex h-10 items-center rounded-[10px] px-4 text-[14px] font-medium transition ${
        active ? "bg-[#EEF4FF] text-[#2563EB]" : "text-[#4B5563] hover:bg-[#F9FAFB]"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

function PageButton({
  children,
  disabled,
  href,
}: {
  children: ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[#C0C6D0]">
        {children}
      </span>
    );
  }

  return (
    <Link
      className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[#4B5563] transition hover:bg-[#F9FAFB]"
      href={href}
    >
      {children}
    </Link>
  );
}
