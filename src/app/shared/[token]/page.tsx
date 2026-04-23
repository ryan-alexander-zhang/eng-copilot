import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleHelp, Lock, ShieldCheck } from "lucide-react";
import { AnnotationPanel } from "@/components/documents/annotation-panel";
import { DocumentReader } from "@/components/documents/document-reader";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  countWords,
  estimateReadingMinutes,
  formatDateTimeLabel,
  formatLongDateLabel,
} from "@/lib/documents/metrics";
import { getSharedDocument } from "@/lib/documents/get-shared-document";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let sessionUserId: string;

  try {
    const session = await getRequiredSession();
    sessionUserId = session.user.id;
  } catch (error) {
    if (!(error instanceof UnauthenticatedError)) {
      throw error;
    }

    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/shared/${token}`)}`);
  }

  let document: Awaited<ReturnType<typeof getSharedDocument>>;
  try {
    document = await getSharedDocument({
      prisma,
      token,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SHARE_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const wordCount = countWords(document.rawMarkdown);
  const readingMinutes = estimateReadingMinutes(wordCount);
  const ownerLabel = document.owner.name?.trim() || extractOwnerName(document.owner.email);
  const userWordListPrefs = await prisma.userWordListPreference.findMany({
    where: {
      userId: sessionUserId,
    },
    select: {
      wordList: {
        select: {
          slug: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#E8EBF0] bg-white px-8">
          <div className="flex items-center gap-4">
            <Link className="text-[23px] font-semibold tracking-[-0.05em] text-[#111827]" href="/documents">
              eng-copilot
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-2 text-[14px] font-medium text-[#2563EB]">
              <Lock className="h-4 w-4" strokeWidth={2} />
              Shared view
            </span>
          </div>
          <div className="flex items-center gap-6 text-[15px] text-[#4B5563]">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              Read-only
            </span>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]" type="button">
              <CircleHelp className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="grid gap-6 px-10 py-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0">
            <div className="rounded-[20px] border border-[#E8EBF0] bg-white p-7">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#111827]">
                    {document.title}
                  </h1>
                  <p className="mt-4 flex flex-wrap items-center gap-3 text-[18px] text-[#6B7280]">
                    <span>Shared by {ownerLabel}</span>
                    <span>•</span>
                    <span>{formatLongDateLabel(document.updatedAt)}</span>
                  </p>
                  <div className="mt-7 rounded-[16px] border border-[#DDEAFE] bg-[#F5F9FF] px-5 py-5">
                    <p className="text-[15px] font-semibold text-[#374151]">
                      This is a read-only shared document.
                    </p>
                    <p className="mt-2 text-[14px] leading-7 text-[#6B7280]">
                      You can view highlights and annotations, but cannot edit this document.
                    </p>
                  </div>
                </div>

                <dl className="grid min-w-[230px] gap-4 rounded-[16px] border border-[#E8EBF0] p-5 text-[14px] text-[#6B7280]">
                  <MetadataRow label="Created" value={formatLongDateLabel(document.createdAt)} />
                  <MetadataRow label="Last edited" value={formatLongDateLabel(document.updatedAt)} />
                  <MetadataRow label="Words" value={wordCount.toLocaleString()} />
                  <MetadataRow label="Reading time" value={`${readingMinutes} min`} />
                </dl>
              </div>
            </div>

            <div className="mt-4">
              <DocumentReader
                annotations={document.annotations}
                blocks={document.blocks}
                footer={undefined}
                highlightMatches={document.highlightMatches}
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
                {buildReaderWordLists(userWordListPrefs.map((preference) => preference.wordList.slug)).map((wordList) => (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium ${
                      wordList.isSelected
                        ? "border-[#DCE8FF] bg-[#F5F9FF] text-[#3B82F6]"
                        : "border-[#E5E7EB] bg-white text-[#4B5563]"
                    }`}
                    key={wordList.id}
                  >
                    {wordList.name}
                    {wordList.isSelected ? <span className="text-[11px]">●</span> : null}
                  </span>
                ))}
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
              annotations={document.annotations.slice(0, 3)}
              readOnly
              variant="compact"
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt>{label}</dt>
      <dd className="font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

function extractOwnerName(email: string | null) {
  if (!email) {
    return "a teammate";
  }

  return email.split("@")[0];
}

function buildReaderWordLists(selectedSlugs: string[]) {
  const selectedSlugSet = new Set(selectedSlugs);

  return BUILT_IN_LISTS.filter((list) =>
    ["cet4", "cet6", "ielts", "toefl"].includes(list.slug),
  ).map((list) => ({
    id: list.slug,
    name: list.name,
    isSelected: selectedSlugSet.has(list.slug),
  }));
}
