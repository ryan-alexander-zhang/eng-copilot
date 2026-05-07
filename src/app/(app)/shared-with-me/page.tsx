import Link from "next/link";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLibrarySidebarData } from "@/lib/documents/get-library-sidebar-data";
import { formatCompactNumber, formatDateTimeLabel } from "@/lib/documents/metrics";
import { LibraryPageShell } from "@/components/layout/library-page-shell";

export default async function SharedWithMePage() {
  const session = await getRequiredSession();
  const [sidebarData, sharedDocuments] = await Promise.all([
    getLibrarySidebarData({
      ownerId: session.user.id,
      prisma,
    }),
    prisma.documentShare.findMany({
      where: {
        isActive: true,
        document: {
          ownerId: {
            not: session.user.id,
          },
          trashedAt: null,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        token: true,
        document: {
          select: {
            title: true,
            originalName: true,
            updatedAt: true,
            owner: {
              select: {
                name: true,
                email: true,
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
        },
      },
    }),
  ]);
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");
  const contributorCount = new Set(
    sharedDocuments.map((item) => item.document.owner.email ?? item.document.owner.name ?? "unknown"),
  ).size;
  const totalAnnotations = sharedDocuments.reduce(
    (sum, item) => sum + item.document._count.annotations,
    0,
  );

  return (
    <LibraryPageShell
      activeItem="shared-with-me"
      counts={sidebarData.counts}
      storage={sidebarData.storage}
      userInitial={userInitial}
    >
      <div className="w-full">
        <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">
          Shared with Me
        </h1>
        <p className="mt-3 max-w-[720px] text-[22px] leading-8 text-[#7B8594]">
          Review the read-only documents other people have shared into this workspace.
        </p>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <MetricCard
            label="Shared documents"
            value={formatCompactNumber(sharedDocuments.length)}
          />
          <MetricCard
            label="Contributors"
            value={formatCompactNumber(contributorCount)}
          />
          <MetricCard
            label="Annotations visible"
            value={formatCompactNumber(totalAnnotations)}
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-[18px] border border-[#E8EBF0] bg-white">
          <table className="min-w-full divide-y divide-[#E8EBF0] text-left">
            <thead className="bg-[#FBFCFE] text-[13px] font-medium text-[#7B8594]">
              <tr>
                <th className="px-5 py-4">Document</th>
                <th className="px-4 py-4">Owner</th>
                <th className="px-4 py-4">Word lists</th>
                <th className="px-4 py-4">Annotations</th>
                <th className="px-4 py-4">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBF0] bg-white">
              {sharedDocuments.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-[15px] text-[#6B7280]" colSpan={5}>
                    Nothing has been shared with you yet.
                  </td>
                </tr>
              ) : null}
              {sharedDocuments.map((item) => (
                <tr className="align-top" key={item.token}>
                  <td className="px-5 py-5">
                    <Link
                      className="block text-[16px] font-semibold text-[#111827] transition hover:text-[#2563EB]"
                      href={`/shared/${item.token}`}
                    >
                      {item.document.title}
                    </Link>
                    <p className="mt-1 text-[14px] text-[#7B8594]">{item.document.originalName}</p>
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {item.document.owner.name ?? item.document.owner.email ?? "Unknown"}
                  </td>
                  <td className="px-4 py-5">
                    <WordListCell
                      names={item.document.activeLists.map((wordList) => wordList.wordList.name)}
                    />
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {formatCompactNumber(item.document._count.annotations)}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-[#4B5563]">
                    {formatDateTimeLabel(item.document.updatedAt)}
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

function WordListCell({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-[14px] text-[#9CA3AF]">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {names.slice(0, 2).map((name) => (
        <span
          className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[12px] font-medium text-[#3B82F6]"
          key={name}
        >
          {name}
        </span>
      ))}
      {names.length > 2 ? (
        <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]">
          +{names.length - 2}
        </span>
      ) : null}
    </div>
  );
}
