import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleHelp, Lock, ShieldCheck } from "lucide-react";
import { SharedDocumentShell } from "@/components/documents/shared-document-shell";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { countWords, estimateReadingMinutes } from "@/lib/documents/metrics";
import { getSharedDocument } from "@/lib/documents/get-shared-document";

export default async function SharedDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ annotation?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    await getRequiredSession();
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
  const ownerInitials = getUserInitials(ownerLabel);

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

        <SharedDocumentShell
          activeWordLists={document.activeLists.map((list) => list.wordList)}
          annotations={document.annotations}
          blocks={document.blocks}
          createdAt={document.createdAt}
          highlightMatches={document.highlightMatches}
          initialSelectedAnnotationId={resolvedSearchParams.annotation ?? null}
          key={resolvedSearchParams.annotation ?? "shared-document"}
          originalName={document.originalName}
          ownerInitials={ownerInitials}
          ownerLabel={ownerLabel}
          rawMarkdown={document.rawMarkdown}
          readingMinutes={readingMinutes}
          title={document.title}
          token={token}
          updatedAt={document.updatedAt}
          wordCount={wordCount}
        />
      </div>
    </main>
  );
}

function extractOwnerName(email: string | null) {
  if (!email) {
    return "a teammate";
  }

  return email.split("@")[0];
}
function getUserInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}
