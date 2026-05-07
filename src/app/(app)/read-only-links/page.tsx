import Link from "next/link";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLibrarySidebarData } from "@/lib/documents/get-library-sidebar-data";
import {
  formatCompactNumber,
  formatDateTimeLabel,
  formatLongDateLabel,
} from "@/lib/documents/metrics";
import { LibraryPageShell } from "@/components/layout/library-page-shell";

export default async function ReadOnlyLinksPage() {
  const session = await getRequiredSession();
  const [sidebarData, sharedDocuments] = await Promise.all([
    getLibrarySidebarData({
      ownerId: session.user.id,
      prisma,
    }),
    prisma.document.findMany({
      where: {
        ownerId: session.user.id,
        trashedAt: null,
        share: {
          is: {
            isActive: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        updatedAt: true,
        share: {
          select: {
            token: true,
            createdAt: true,
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
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");
  const totalAnnotations = sharedDocuments.reduce(
    (sum, document) => sum + document._count.annotations,
    0,
  );

  return (
    <LibraryPageShell
      activeItem="read-only-links"
      counts={sidebarData.counts}
      storage={sidebarData.storage}
      userInitial={userInitial}
    >
      <div className="w-full">
        <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">
          Read-Only Links
        </h1>
        <p className="mt-3 max-w-[760px] text-[22px] leading-8 text-[#7B8594]">
          Track every active share link generated from your document library.
        </p>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <MetricCard
            label="Active links"
            value={formatCompactNumber(sharedDocuments.length)}
          />
          <MetricCard
            label="Documents shared"
            value={formatCompactNumber(sharedDocuments.length)}
          />
          <MetricCard
            label="Annotations included"
            value={formatCompactNumber(totalAnnotations)}
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-[18px] border border-[#E8EBF0] bg-white">
          <table className="min-w-full divide-y divide-[#E8EBF0] text-left">
            <thead className="bg-[#FBFCFE] text-[13px] font-medium text-[#7B8594]">
              <tr>
                <th className="px-5 py-4">Document</th>
                <th className="px-4 py-4">Share link</th>
                <th className="px-4 py-4">Enabled</th>
                <th className="px-4 py-4">Annotations</th>
                <th className="px-4 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF0] bg-white">
              {sharedDocuments.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-[15px] text-[#6B7280]" colSpan={5}>
                    No read-only links are active right now.
                  </td>
                </tr>
              ) : null}
              {sharedDocuments.map((document) => (
                <tr className="align-top" key={document.id}>
                  <td className="px-5 py-5">
                    <Link
                      className="block text-[16px] font-semibold text-[#111827] transition hover:text-[#2563EB]"
                      href={`/shared/${document.share?.token}`}
                    >
                      {document.title}
                    </Link>
                    <p className="mt-1 text-[14px] text-[#7B8594]">{document.originalName}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-[15px] font-medium text-[#2563EB]">
                      {`/shared/${document.share?.token ?? ""}`}
                    </p>
                    <p className="mt-1 text-[13px] text-[#98A2B3]">Status: Active</p>
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {document.share ? formatLongDateLabel(document.share.createdAt) : "-"}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {formatCompactNumber(document._count.annotations)}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {formatDateTimeLabel(document.updatedAt)}
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
