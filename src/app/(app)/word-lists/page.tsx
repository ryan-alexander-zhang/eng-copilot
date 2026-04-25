import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Check, ChevronDown, RefreshCw, Search } from "lucide-react";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  countWords,
  formatCompactNumber,
  formatRelativeDayLabel,
  formatStorageAmount,
} from "@/lib/documents/metrics";
import { getWordListDashboardData } from "@/lib/word-lists/get-word-list-dashboard-data";
import { updateUserWordListPreferences } from "@/lib/word-lists/update-user-word-list-preferences";
import { DocumentUploadSidebar } from "@/components/layout/document-upload-sidebar";
import { OwnerDocumentsSidebar } from "@/components/layout/owner-documents-sidebar";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";
import { WordListSelectionForm } from "@/components/word-lists/word-list-selection-form";

export default async function WordListsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const session = await getRequiredSession();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const startedAt = performance.now();
  const [dashboardData, documents, documentCount] = await Promise.all([
    getWordListDashboardData({
      ownerId: session.user.id,
      prisma,
    }),
    prisma.document.findMany({
      where: {
        ownerId: session.user.id,
        trashedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        rawMarkdown: true,
      },
      take: 8,
    }),
    prisma.document.count({
      where: {
        ownerId: session.user.id,
        trashedAt: null,
      },
    }),
  ]);
  const responseTimeMs = Math.max(1, Math.round(performance.now() - startedAt));
  const visibleLists = dashboardData.lists.filter(
    (list) =>
      query.length === 0 ||
      list.name.toLowerCase().includes(query) ||
      list.description.toLowerCase().includes(query),
  );
  const sidebarDocuments = documents.map((document, index) => ({
    id: document.id,
    title: document.title,
    dayLabel: formatRelativeDayLabel(document.updatedAt),
    readingMinutes: Math.max(1, Math.round(countWords(document.rawMarkdown) / 200)),
    isActive: index === 0,
  }));
  const storageBytes = documents.reduce(
    (sum, document) => sum + Buffer.byteLength(document.rawMarkdown, "utf8"),
    0,
  );
  const storageTotalBytes = 10 * 1024 * 1024 * 1024;
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");

  async function updateWordLists(formData: FormData) {
    "use server";

    await updateUserWordListPreferences({
      ownerId: session.user.id,
      selectedWordListIds: formData
        .getAll("wordListId")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
      prisma,
    });

    revalidatePath("/documents", "layout");
    revalidatePath("/word-lists");
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="word-lists" userInitial={userInitial} />

        <div className="flex min-h-[calc(100vh-72px)]">
          <aside className="w-full max-w-[296px] border-r border-[#E8EBF0] bg-white px-6 py-6">
            <DocumentUploadSidebar />
            <div className="mt-6">
              <OwnerDocumentsSidebar
                documents={sidebarDocuments}
                storage={{
                  usedLabel: formatStorageAmount(storageBytes),
                  totalLabel: "10 GB",
                  progress: storageBytes / storageTotalBytes,
                }}
                totalCount={documentCount}
              />
            </div>
          </aside>

          <section className="flex min-w-0 flex-1">
            <div className="min-w-0 flex-1 px-8 py-9">
              <div className="max-w-[760px]">
                <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">
                  Word Lists
                </h1>
                <p className="mt-4 text-[22px] leading-8 text-[#7B8594]">
                  Manage vocabulary lists used for automatic highlighting in your documents.
                </p>
                <p className="mt-2 text-[20px] leading-8 text-[#7B8594]">
                  Lists are loaded from the backend and kept up to date.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <form className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center" method="GET">
                  <div className="relative w-full max-w-[360px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
                    <input
                      className="h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] outline-none transition focus:border-[#BFDBFE] focus:ring-4 focus:ring-[#DBEAFE]"
                      defaultValue={resolvedSearchParams.q ?? ""}
                      name="q"
                      placeholder="Search lists..."
                      type="search"
                    />
                  </div>

                  <div className="relative">
                    <select className="h-11 appearance-none rounded-[12px] border border-[#E5E7EB] bg-white pl-4 pr-10 text-[14px] font-medium text-[#4B5563]">
                      <option>All Sources</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
                  </div>

                  <button
                    className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#4B5563]"
                    form="word-lists-form"
                    type="submit"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} />
                    Refresh
                  </button>
                </form>

                <div className="flex items-center gap-3 text-[14px] text-[#6B7280]">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#56C271]" />
                  Synced from backend
                  <span className="text-[#9CA3AF]">Just now</span>
                </div>
              </div>

              <WordListSelectionForm
                lists={visibleLists}
                updateWordListsAction={updateWordLists}
              />
            </div>

            <aside className="w-full max-w-[310px] border-l border-[#E8EBF0] bg-[#FBFCFE] px-5 py-7">
              <section className="rounded-[18px] border border-[#E8EBF0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-[#111827]">Selected for highlighting</h2>
                  <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[12px] font-semibold text-[#3B82F6]">
                    {dashboardData.selectedCount}
                  </span>
                </div>
                <p className="mt-4 text-[14px] leading-7 text-[#6B7280]">
                  These lists will be used to automatically highlight words in your documents.
                </p>
                <div className="mt-5 space-y-3">
                  {dashboardData.lists.filter((list) => list.isSelected).length === 0 ? (
                    <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 text-[14px] text-[#6B7280]">
                      No lists selected yet.
                    </div>
                  ) : (
                    dashboardData.lists
                      .filter((list) => list.isSelected)
                      .map((list) => (
                        <div
                          className="flex items-center justify-between rounded-[14px] border border-[#E5E7EB] bg-[#F9FBFF] px-4 py-4"
                          key={list.id}
                        >
                          <span className="flex items-center gap-3 text-[15px] font-medium text-[#374151]">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3B82F6] text-white">
                              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                            </span>
                            {list.name}
                          </span>
                          <span className="text-[13px] text-[#6B7280]">
                            {formatCompactNumber(list.wordCount)} words
                          </span>
                        </div>
                      ))
                  )}
                </div>

                <div className="mt-6 border-t border-[#EEF2F6] pt-6">
                  <p className="text-[14px] text-[#7B8594]">Total words</p>
                  <p className="mt-2 text-[44px] font-semibold tracking-[-0.05em] text-[#111827]">
                    {formatCompactNumber(dashboardData.totalSelectedWords)}
                  </p>
                  <p className="mt-2 text-[14px] text-[#7B8594]">
                    Across {dashboardData.selectedCount} lists
                  </p>
                </div>

                <div className="mt-8">
                  <div className="flex items-center gap-2 text-[14px] text-[#7B8594]">
                    Estimated highlight coverage
                  </div>
                  <p className={`mt-3 text-[18px] font-semibold ${dashboardData.coverage.toneClassName}`}>
                    {dashboardData.coverage.label}
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">
                    {dashboardData.coverage.description}
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-[#EEF2F6]">
                    <div
                      className={`h-2 rounded-full ${dashboardData.coverage.progressClassName}`}
                      style={{ width: `${Math.max(10, dashboardData.coverage.ratio * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#9CA3AF]">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-[14px] text-[#7B8594]">Sample matched words</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {dashboardData.sampleMatchedWords.length === 0 ? (
                      <span className="text-[14px] text-[#9CA3AF]">No matches yet</span>
                    ) : (
                      dashboardData.sampleMatchedWords.map((term) => (
                        <span
                          className="rounded-full border border-[#DCE8FF] bg-[#F5F9FF] px-2.5 py-1 text-[12px] font-medium text-[#3B82F6]"
                          key={term}
                        >
                          {term}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <Link
                  className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[14px] font-medium text-[#4B5563]"
                  href={sidebarDocuments[0] ? `/documents/${sidebarDocuments[0].id}` : "/documents"}
                >
                  Preview in a document
                </Link>
              </section>

              <section className="mt-5 rounded-[18px] border border-[#E8EBF0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-[#111827]">Backend status</h2>
                  <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[12px] font-semibold text-[#12B76A]">
                    Healthy
                  </span>
                </div>
                <p className="mt-4 text-[14px] leading-7 text-[#6B7280]">
                  All word lists are up to date.
                  <br />
                  API response time: {responseTimeMs}ms
                </p>
                <button
                  className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#E5E7EB] text-[14px] font-medium text-[#4B5563]"
                  form="word-lists-form"
                  type="submit"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={2} />
                  Sync now
                </button>
              </section>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}
