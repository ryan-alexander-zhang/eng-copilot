import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLibrarySidebarData } from "@/lib/documents/get-library-sidebar-data";
import {
  countWords,
  extractSummary,
  formatCompactNumber,
  formatDateTimeLabel,
} from "@/lib/documents/metrics";
import { LibraryPageShell } from "@/components/layout/library-page-shell";

export default async function TrashPage() {
  const session = await getRequiredSession();
  const [sidebarData, trashedDocuments] = await Promise.all([
    getLibrarySidebarData({
      ownerId: session.user.id,
      prisma,
    }),
    prisma.document.findMany({
      where: {
        ownerId: session.user.id,
        trashedAt: {
          not: null,
        },
      },
      orderBy: {
        trashedAt: "desc",
      },
      select: {
        title: true,
        originalName: true,
        plainText: true,
        updatedAt: true,
        trashedAt: true,
        _count: {
          select: {
            annotations: true,
          },
        },
      },
    }),
  ]);
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");
  const totalWords = trashedDocuments.reduce(
    (sum, document) => sum + countWords(document.plainText),
    0,
  );

  return (
    <LibraryPageShell
      activeItem="trash"
      counts={sidebarData.counts}
      storage={sidebarData.storage}
      userInitial={userInitial}
    >
      <div className="w-full">
        <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">Trash</h1>
        <p className="mt-3 max-w-[720px] text-[22px] leading-8 text-[#7B8594]">
          Review documents removed from your main library. Trashed files stay hidden from the
          active workspace.
        </p>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <MetricCard
            label="Documents in trash"
            value={formatCompactNumber(trashedDocuments.length)}
          />
          <MetricCard
            label="Annotations retained"
            value={formatCompactNumber(
              trashedDocuments.reduce((sum, document) => sum + document._count.annotations, 0),
            )}
          />
          <MetricCard label="Words stored" value={formatCompactNumber(totalWords)} />
        </div>

        <div className="mt-8 overflow-hidden rounded-[18px] border border-[#E8EBF0] bg-white">
          <table className="min-w-full divide-y divide-[#E8EBF0] text-left">
            <thead className="bg-[#FBFCFE] text-[13px] font-medium text-[#7B8594]">
              <tr>
                <th className="px-5 py-4">Document</th>
                <th className="px-4 py-4">Summary</th>
                <th className="px-4 py-4">Words</th>
                <th className="px-4 py-4">Annotations</th>
                <th className="px-4 py-4">Moved to trash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF0] bg-white">
              {trashedDocuments.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-[15px] text-[#6B7280]" colSpan={5}>
                    Trash is empty.
                  </td>
                </tr>
              ) : null}
              {trashedDocuments.map((document) => (
                <tr className="align-top" key={document.originalName}>
                  <td className="px-5 py-5">
                    <p className="text-[16px] font-semibold text-[#111827]">
                      {document.originalName || document.title}
                    </p>
                    <p className="mt-1 text-[14px] text-[#7B8594]">{document.originalName}</p>
                  </td>
                  <td className="px-4 py-5 text-[15px] leading-7 text-[#4B5563]">
                    {extractSummary(document.plainText)}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {formatCompactNumber(countWords(document.plainText))}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {formatCompactNumber(document._count.annotations)}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {document.trashedAt ? formatDateTimeLabel(document.trashedAt) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LibraryPageShell>
  );
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[18px] border border-[#E8EBF0] bg-white p-6">
      <p className="text-[38px] font-semibold tracking-[-0.04em] text-[#111827]">{value}</p>
      <p className="mt-1 text-[15px] text-[#7B8594]">{label}</p>
    </article>
  );
}
