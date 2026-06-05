import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FolderOpen,
  Link2,
  MessageSquareText,
} from "lucide-react";
import {
  AutoSubmitSelectField,
  type AutoSubmitSelectOption,
} from "@/components/vocabulary/auto-submit-select-field";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLibrarySidebarData } from "@/lib/documents/get-library-sidebar-data";
import {
  countWords,
  extractSummary,
  formatCompactNumber,
  formatDateTimeLabel,
} from "@/lib/documents/metrics";
import { moveDocumentToTrash } from "@/lib/documents/move-document-to-trash";
import { enableDocumentShare } from "@/lib/shares/enable-document-share";
import { revokeDocumentShare } from "@/lib/shares/revoke-document-share";
import { DocumentTableRowActions } from "@/components/documents/document-table-row-actions";
import { LibraryPageShell } from "@/components/layout/library-page-shell";

const PAGE_SIZE = 8;
const DOCUMENT_SORT_OPTIONS: AutoSubmitSelectOption[] = [
  { label: "Sort: Last edited", value: "last-edited" },
  { label: "Sort: Created", value: "created" },
  { label: "Sort: Title", value: "title" },
];

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
  const [sidebarData, documents] = await Promise.all([
    getLibrarySidebarData({
      ownerId: session.user.id,
      prisma,
    }),
    prisma.document.findMany({
      where: {
        ownerId: session.user.id,
        sourceFormat: "MARKDOWN",
        trashedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        plainText: true,
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
  ]);
  const documentsWithMetrics = documents.map((document) => ({
    ...document,
    summary: extractSummary(document.plainText),
    wordCount: countWords(document.plainText),
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
          return isUpdatedWithinLastDays(document.updatedAt, 7);
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
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");

  async function enableShareAction(formData: FormData) {
    "use server";

    const documentId = getRequiredString(formData, "documentId");
    const share = await enableDocumentShare({
      documentId,
      ownerId: session.user.id,
      prisma,
    });

    revalidatePath("/documents");

    return {
      isActive: share.isActive,
      token: share.token,
    };
  }

  async function moveToTrashAction(formData: FormData) {
    "use server";

    const documentId = getRequiredString(formData, "documentId");
    const result = await moveDocumentToTrash({
      documentId,
      ownerId: session.user.id,
      prisma,
    });

    revalidatePath("/documents");
    revalidatePath("/word-lists");
    revalidatePath("/annotations");

    if (result.shareToken) {
      revalidatePath(`/shared/${result.shareToken}`);
    }
  }

  async function revokeShareAction(formData: FormData) {
    "use server";

    const documentId = getRequiredString(formData, "documentId");
    const share = await revokeDocumentShare({
      documentId,
      ownerId: session.user.id,
      prisma,
    });

    revalidatePath("/documents");

    if (share?.token) {
      revalidatePath(`/shared/${share.token}`);
    }

    return share;
  }

  return (
    <LibraryPageShell
      activeItem="documents"
      counts={sidebarData.counts}
      storage={sidebarData.storage}
      userInitial={userInitial}
    >
      <div className="w-full">
        <h1 className="text-[58px] font-semibold tracking-[-0.06em]">
          Documents
        </h1>
        <p className="text-muted mt-3 text-[22px] leading-8">
          Manage your reading files, annotations, and sharing settings.
        </p>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          <StatCard
            icon={<FolderOpen className="h-5 w-5" strokeWidth={2} />}
            label="Total documents"
            value={formatCompactNumber(documentsWithMetrics.length)}
          />
          <StatCard
            icon={<MessageSquareText className="h-5 w-5" strokeWidth={2} />}
            label="Total annotations"
            tint="success"
            value={formatCompactNumber(totalAnnotations)}
          />
          <StatCard
            icon={<Link2 className="h-5 w-5" strokeWidth={2} />}
            label="Read-only links active"
            tint="accent"
            value={formatCompactNumber(activeShareCount)}
          />
          <StatCard
            icon={<BookOpenCheck className="h-5 w-5" strokeWidth={2} />}
            label="Word lists used"
            tint="warning"
            value={formatCompactNumber(usedWordListCount)}
          />
        </div>

        <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center">
            <form className="relative w-full max-w-[420px]" method="GET">
              <input name="tab" type="hidden" value={activeTab} />
              <input name="sort" type="hidden" value={sort} />
              <FileSearch
                className="text-muted pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                strokeWidth={2}
              />
              <input
                className="field-input h-11 rounded-[12px] pl-11 pr-12 text-[14px]"
                defaultValue={resolvedSearchParams.q ?? ""}
                name="q"
                placeholder="Search documents..."
                type="search"
              />
              <span className="kbd-hint pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px]">
                ⌘K
              </span>
            </form>

            <div className="inline-flex rounded-[12px] border border-[color:var(--border)] bg-[var(--surface-strong)] p-1">
              <TabLink
                active={activeTab === "all"}
                href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "all" })}
              >
                All
              </TabLink>
              <TabLink
                active={activeTab === "recent"}
                href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "recent" })}
              >
                Recent
              </TabLink>
              <TabLink
                active={activeTab === "shared"}
                href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "shared" })}
              >
                Shared
              </TabLink>
              <TabLink
                active={activeTab === "annotated"}
                href={buildQuery({ q: resolvedSearchParams.q, sort, tab: "annotated" })}
              >
                Annotated
              </TabLink>
            </div>
          </div>

          <form className="flex items-center" method="GET">
            <input name="q" type="hidden" value={resolvedSearchParams.q ?? ""} />
            <input name="tab" type="hidden" value={activeTab} />
            <AutoSubmitSelectField
              className="min-w-[220px]"
              name="sort"
              options={DOCUMENT_SORT_OPTIONS}
              value={sort}
            />
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[var(--surface-strong)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] text-left">
            <thead className="text-muted bg-[var(--surface-soft)] text-[13px] font-medium">
              <tr>
                <th className="px-4 py-4">Document</th>
                <th className="px-4 py-4">Words</th>
                <th className="px-4 py-4">Last edited</th>
                <th className="px-4 py-4">Word lists</th>
                <th className="px-4 py-4">Annotations</th>
                <th className="px-4 py-4">Sharing</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)] bg-[var(--surface-strong)]">
              {pagedDocuments.length === 0 ? (
                <tr>
                  <td className="text-muted px-6 py-14 text-center text-[15px]" colSpan={7}>
                    No documents matched this view.
                  </td>
                </tr>
              ) : null}
              {pagedDocuments.map((document) => (
                <tr className="align-top" key={document.id}>
                  <td className="px-4 py-5">
                    <Link className="block" href={`/documents/${document.id}`}>
                      <p className="text-[16px] font-semibold">
                        {document.originalName || document.title}
                      </p>
                      <p className="text-muted mt-1 max-w-[320px] text-[14px] leading-6">
                        {document.summary}
                      </p>
                    </Link>
                  </td>
                  <td className="text-soft px-4 py-5 text-[15px]">
                    {formatCompactNumber(document.wordCount)}
                  </td>
                  <td className="text-soft px-4 py-5 text-[15px]">
                    {formatDateTimeLabel(document.updatedAt)}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-2">
                      {document.activeLists.length > 0 ? (
                        document.activeLists.slice(0, 2).map((wordList) => (
                          <span
                            className="badge-accent"
                            key={`${document.id}-${wordList.wordList.name}`}
                          >
                            {wordList.wordList.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted text-[14px]">-</span>
                      )}
                      {document.activeLists.length > 2 ? (
                        <span className="badge-neutral">
                          +{document.activeLists.length - 2}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-soft px-4 py-5 text-[15px]">
                    {document._count.annotations}
                  </td>
                  <DocumentTableRowActions
                    documentId={document.id}
                    enableShareAction={enableShareAction}
                    initialShare={
                      document.share
                        ? {
                            isActive: document.share.isActive,
                            token: document.share.token,
                          }
                        : null
                    }
                    moveToTrashAction={moveToTrashAction}
                    revokeShareAction={revokeShareAction}
                    originalName={document.originalName}
                    title={document.title}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-muted mt-6 flex flex-col gap-4 text-[14px] xl:flex-row xl:items-center xl:justify-between">
          <p>
            {filteredDocuments.length === 0
              ? "0 documents"
              : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
                  currentPage * PAGE_SIZE,
                  filteredDocuments.length,
                )} of ${filteredDocuments.length} documents`}
          </p>

          <div className="flex items-center gap-3">
            <PageButton
              disabled={currentPage === 1}
              href={buildQuery({
                page: String(currentPage - 1),
                q: resolvedSearchParams.q,
                sort,
                tab: activeTab,
              })}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </PageButton>
            <span className="pagination-link pagination-link-active inline-flex h-10 min-w-10 items-center justify-center rounded-[12px] px-3">
              {currentPage}
            </span>
            <PageButton
              disabled={currentPage >= totalPages}
              href={buildQuery({
                page: String(currentPage + 1),
                q: resolvedSearchParams.q,
                sort,
                tab: activeTab,
              })}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </PageButton>
          </div>
        </div>
      </div>
    </LibraryPageShell>
  );
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

function isUpdatedWithinLastDays(date: Date, days: number, now = Date.now()) {
  return date.getTime() >= now - days * 86400000;
}

function getRequiredString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${fieldName}`);
  }

  return value;
}

function StatCard({
  icon,
  label,
  value,
  tint = "accent",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tint?: "accent" | "success" | "warning";
}) {
  const iconClassName =
    tint === "success"
      ? "bg-[var(--success-bg)] text-[var(--success-foreground)]"
      : tint === "warning"
        ? "bg-[var(--warning-bg)] text-[var(--warning-foreground)]"
        : "bg-[var(--accent-soft)] text-[var(--accent-strong)]";

  return (
    <article className="panel-card p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${iconClassName}`}>
        {icon}
      </div>
      <p className="mt-5 text-[38px] font-semibold tracking-[-0.04em]">{value}</p>
      <p className="text-muted mt-1 text-[15px]">{label}</p>
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
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          : "text-[var(--foreground-soft)] hover:bg-[var(--surface-soft)]"
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
      <span className="pagination-link inline-flex h-10 w-10 items-center justify-center rounded-[12px] opacity-40">
        {children}
      </span>
    );
  }

  return (
    <Link
      className="pagination-link inline-flex h-10 w-10 items-center justify-center rounded-[12px]"
      href={href}
    >
      {children}
    </Link>
  );
}
