import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMatchedWords } from "@/lib/documents/build-matched-words";
import { getOwnerDocument } from "@/lib/documents/get-owner-document";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";

const READER_MATCHED_WORD_ORDER = [
  "valuable",
  "necessity",
  "embrace",
  "adaptability",
  "critical",
  "opportunities",
  "beautiful",
  "curious",
  "consistently",
  "reflect",
  "inspire",
  "committing",
];

export default async function MatchedWordsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const session = await getRequiredSession();
  const { documentId } = await params;
  const document = await getOwnerDocument({
    documentId,
    ownerId: session.user.id,
    prisma,
  });

  if (!document) {
    notFound();
  }

  const activeWordListIds = document.activeLists.map((entry) => entry.wordList.id);
  const activeWordLists =
    activeWordListIds.length > 0
      ? await prisma.wordList.findMany({
          where: {
            id: {
              in: activeWordListIds,
            },
          },
          select: {
            name: true,
            entries: {
              select: {
                term: true,
              },
            },
          },
        })
      : [];
  const { matchedWordCount, matchedWords } = buildMatchedWords({
    activeWordLists,
    highlightMatches: document.highlightMatches,
    limit: document.highlightMatches.length,
    order: READER_MATCHED_WORD_ORDER,
  });
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="documents" userInitial={userInitial} />

        <section className="mx-auto max-w-4xl px-8 py-8">
          <Link
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#3B82F6]"
            href={`/documents/${document.id}`}
          >
            <span>←</span>
            Back to document
          </Link>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[34px] font-semibold tracking-[-0.04em] text-[#111827]">
                Matched words
              </h1>
              <p className="mt-2 text-[15px] text-[#6B7280]">
                {matchedWordCount} unique matches found in {document.title}.
              </p>
            </div>
          </div>

          {matchedWords.length === 0 ? (
            <div className="mt-6 rounded-[18px] border border-[#E5E7EB] bg-white px-5 py-5 text-[15px] text-[#6B7280]">
              No matched words found for the selected lists.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[20px] border border-[#E8EBF0] bg-white">
              <div className="grid grid-cols-[minmax(0,1fr)_140px_96px] gap-4 border-b border-[#E8EBF0] bg-[#F8FAFC] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                <span>Word</span>
                <span>List</span>
                <span>Count</span>
              </div>
              <div className="divide-y divide-[#E8EBF0]">
                {matchedWords.map((match) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_140px_96px] gap-4 px-5 py-4 text-[15px] text-[#374151]"
                    key={match.term}
                  >
                    <span className="font-medium text-[#111827]">{match.term}</span>
                    <span>{match.listName ?? "Unknown list"}</span>
                    <span>{match.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}
