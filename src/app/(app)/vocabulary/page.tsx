import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, ExternalLink, Search, Upload } from "lucide-react";
import { WordListKind } from "@prisma/client";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildVocabularyLookupLinks } from "@/lib/vocabulary/lookup-links";
import { getOptionalFormString } from "@/lib/vocabulary/form";
import { VocabularyDisclosure } from "@/components/vocabulary/vocabulary-disclosure";
import {
  importVocabularyJson,
  saveVocabularyEntry,
} from "@/lib/vocabulary/service";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";

type VocabularyPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    source?: string;
    wordList?: string;
  }>;
};

export default async function VocabularyPage({ searchParams }: VocabularyPageProps) {
  const session = await getRequiredSession();
  const resolvedSearchParams = await searchParams;
  const [entries, wordLists] = await Promise.all([
    prisma.vocabularyEntry.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        source: true,
        word: true,
        wordLists: {
          select: {
            wordList: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.wordList.findMany({
      where: {
        kind: WordListKind.POSITIVE,
        slug: {
          in: BUILT_IN_LISTS.map((list) => list.slug),
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const selectedWordListSlug = resolvedSearchParams.wordList ?? "all";
  const selectedSource = resolvedSearchParams.source ?? "all";
  const selectedSort = resolvedSearchParams.sort ?? "newest";
  const sourceOptions = [...new Set(entries.map((entry) => entry.source))].sort();
  const visibleEntries = entries
    .filter((entry) => query.length === 0 || entry.word.includes(query))
    .filter((entry) => {
      if (selectedWordListSlug === "all") {
        return true;
      }

      if (selectedWordListSlug === "none") {
        return entry.wordLists.length === 0;
      }

      return entry.wordLists.some((wordList) => wordList.wordList.slug === selectedWordListSlug);
    })
    .filter((entry) => selectedSource === "all" || entry.source === selectedSource)
    .sort((first, second) => {
      if (selectedSort === "oldest") {
        return first.createdAt.getTime() - second.createdAt.getTime();
      }

      if (selectedSort === "word") {
        return first.word.localeCompare(second.word);
      }

      return second.createdAt.getTime() - first.createdAt.getTime();
    });
  const inWordListsCount = entries.filter((entry) => entry.wordLists.length > 0).length;
  const addedThisWeekCount = entries.filter((entry) => isAddedThisWeek(entry.createdAt)).length;
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");

  async function addVocabularyWordAction(formData: FormData) {
    "use server";

    const word = getOptionalFormString(formData, "word");

    if (word === null) {
      return;
    }

    await saveVocabularyEntry({
      ownerId: session.user.id,
      word,
      source: "manual",
      wordListSlugs: formData.getAll("wordListSlug").filter(isString),
      prisma,
    });
    revalidatePath("/vocabulary");
    redirect("/vocabulary");
  }

  async function updateVocabularyWordListsAction(formData: FormData) {
    "use server";

    await saveVocabularyEntry({
      ownerId: session.user.id,
      word: getRequiredString(formData, "word"),
      source: getRequiredString(formData, "source"),
      wordListSlugs: formData.getAll("wordListSlug").filter(isString),
      prisma,
    });
    revalidatePath("/vocabulary");
  }

  async function importVocabularyAction(formData: FormData) {
    "use server";

    const file = formData.get("vocabularyFile");

    if (!(file instanceof File)) {
      throw new Error("Vocabulary JSON file is required");
    }

    await importVocabularyJson({
      ownerId: session.user.id,
      payload: JSON.parse(await file.text()),
      prisma,
    });
    revalidatePath("/vocabulary");
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="vocabulary" userInitial={userInitial} />

        <section className="px-11 py-9">
          <div>
            <h1 className="text-[54px] font-semibold tracking-[-0.06em] text-[#111827]">
              Vocabulary
            </h1>
            <p className="mt-3 text-[18px] text-[#667085]">
              Save words for review, then add them to a Word List to enable highlighting in your documents.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <form className="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" method="GET">
              <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
                <div className="relative w-full xl:w-[290px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] outline-none transition focus:border-[#BFDBFE] focus:ring-4 focus:ring-[#DBEAFE]"
                    defaultValue={resolvedSearchParams.q ?? ""}
                    name="q"
                    placeholder="Search vocabulary..."
                    type="search"
                  />
                </div>

                <Select name="wordList" value={selectedWordListSlug}>
                  <option value="all">All word lists</option>
                  <option value="none">Not in list</option>
                  {wordLists.map((wordList) => (
                    <option key={wordList.id} value={wordList.slug}>
                      {wordList.name}
                    </option>
                  ))}
                </Select>

                <Select name="source" value={selectedSource}>
                  <option value="all">All sources</option>
                  {sourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex xl:justify-end">
                <Select name="sort" value={selectedSort}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="word">Word A-Z</option>
                </Select>
              </div>
              <button aria-label="Submit vocabulary filters" className="sr-only" type="submit" />
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <VocabularyDisclosure
                className="relative"
                trigger="Add word"
                triggerClassName="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] bg-[#2F80ED] px-5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(47,128,237,0.22)]"
              >
                <form action={addVocabularyWordAction} className="absolute right-0 z-30 mt-3 grid w-[320px] gap-3 rounded-[16px] border border-[#E8EBF0] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] text-[#111827] outline-none transition focus:border-[#BFDBFE] focus:ring-4 focus:ring-[#DBEAFE]"
                    name="word"
                    placeholder="Add a word..."
                    required
                  />
                  <div className="grid gap-2">
                    {wordLists.map((wordList) => (
                      <label className="inline-flex items-center gap-2 text-[13px] text-[#4B5563]" key={wordList.id}>
                        <input className="h-4 w-4 rounded border-[#CBD5E1]" name="wordListSlug" type="checkbox" value={wordList.slug} />
                        {wordList.name}
                      </label>
                    ))}
                  </div>
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2F80ED] px-4 text-[13px] font-semibold text-white"
                    type="submit"
                  >
                    Save word
                  </button>
                </form>
              </VocabularyDisclosure>

              <VocabularyDisclosure
                className="relative"
                trigger={
                  <>
                    <Upload className="h-4 w-4" strokeWidth={2} />
                    Import
                  </>
                }
                triggerClassName="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#4B5563]"
              >
                <form action={importVocabularyAction} className="absolute right-0 z-10 mt-3 grid w-[320px] gap-3 rounded-[16px] border border-[#E8EBF0] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                  <input
                    aria-label="Vocabulary JSON file"
                    className="text-[13px] text-[#667085]"
                    name="vocabularyFile"
                    type="file"
                    accept="application/json,.json"
                    required
                  />
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2F80ED] px-4 text-[13px] font-semibold text-white"
                    type="submit"
                  >
                    Import JSON
                  </button>
                </form>
              </VocabularyDisclosure>

              <Link
                className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#4B5563]"
                href="/api/vocabulary"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Export
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[274px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="rounded-[16px] border border-[#E8EBF0] bg-white p-5">
                <p className="text-[15px] text-[#667085]">Total</p>
                <p className="mt-2 text-[48px] font-semibold tracking-[-0.04em] text-[#111827]">
                  {entries.length}
                </p>
                <div className="mt-5 space-y-3 border-t border-[#EEF2F6] pt-5 text-[15px] text-[#4B5563]">
                  <SummaryRow color="#56C271" label="In word lists" value={inWordListsCount} />
                  <SummaryRow color="#F3B846" label="Not in a word list" value={entries.length - inWordListsCount} />
                  <SummaryRow color="#4F8FF7" label="Added this week" value={addedThisWeekCount} />
                </div>
              </section>

              <section className="rounded-[16px] border border-[#E8EBF0] bg-white p-5">
                <h2 className="text-[15px] font-semibold text-[#111827]">Word lists</h2>
                <div className="mt-5 space-y-3">
                  {wordLists.map((wordList) => (
                    <div className="flex items-center justify-between text-[15px] text-[#4B5563]" key={wordList.id}>
                      <span>{wordList.name}</span>
                      <span>{countEntriesForWordList(entries, wordList.slug)}</span>
                    </div>
                  ))}
                </div>
                <Link className="mt-5 inline-flex text-[15px] font-medium text-[#2563EB]" href="/word-lists">
                  Manage word lists →
                </Link>
              </section>
            </aside>

            <section className="overflow-visible rounded-[16px] border border-[#E8EBF0] bg-white">
              <table className="min-w-full divide-y divide-[#EEF2F6] text-left">
                <thead className="bg-[#FBFCFE] text-[14px] font-medium text-[#667085]">
                  <tr>
                    <th className="px-5 py-4">Word</th>
                    <th className="px-4 py-4">Added</th>
                    <th className="px-4 py-4">Word List</th>
                    <th className="px-4 py-4">Lookup links</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {visibleEntries.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-[15px] text-[#667085]" colSpan={5}>
                        No vocabulary matched this view.
                      </td>
                    </tr>
                  ) : null}
                  {visibleEntries.map((entry) => {
                    const entryWordLists = entry.wordLists.map((wordList) => wordList.wordList);
                    const selectedSlugs = new Set(entryWordLists.map((wordList) => wordList.slug));

                    return (
                      <tr key={entry.id}>
                        <td className="px-5 py-5 text-[16px] font-semibold text-[#111827]">
                          {entry.word}
                        </td>
                        <td className="px-4 py-5 text-[14px] text-[#667085]">
                          {formatVocabularyDate(entry.createdAt)}
                        </td>
                        <td className="px-4 py-5">
                          {entryWordLists.length === 0 ? (
                            <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-[12px] font-medium text-[#667085]">
                              Not in list
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {entryWordLists.map((wordList) => (
                                <span
                                  className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[12px] font-semibold text-[#2563EB]"
                                  key={wordList.id}
                                >
                                  {wordList.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-5 align-top">
                          <VocabularyDisclosure
                            className="relative w-max"
                            trigger="Open links"
                            triggerClassName="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[14px] font-medium text-[#4B5563] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:bg-[#F8FAFC]"
                          >
                            <div className="absolute left-0 top-11 z-30 min-w-[236px] rounded-[14px] border border-[#E5E7EB] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                              {buildVocabularyLookupLinks(entry.word).map((link) => (
                                <a
                                  className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium text-[#374151] transition hover:bg-[#F8FAFC]"
                                  href={link.href}
                                  key={link.href}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <span>{link.label}</span>
                                  <ExternalLink className="h-4 w-4 text-[#667085]" strokeWidth={2} aria-hidden="true" />
                                </a>
                              ))}
                            </div>
                          </VocabularyDisclosure>
                        </td>
                        <td className="px-4 py-5">
                          <VocabularyDisclosure
                            className="relative w-max"
                            trigger={entryWordLists.length === 0 ? "Add to Word List" : "Manage lists"}
                            triggerClassName="inline-flex cursor-pointer rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-[14px] font-medium text-[#4B5563]"
                          >
                            <form action={updateVocabularyWordListsAction} className="absolute right-0 top-11 z-30 grid w-[220px] gap-3 rounded-[14px] border border-[#E8EBF0] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                              <input name="word" type="hidden" value={entry.word} />
                              <input name="source" type="hidden" value={entry.source} />
                              {wordLists.map((wordList) => (
                                <label className="flex items-center gap-2 text-[13px] text-[#4B5563]" key={wordList.id}>
                                  <input
                                    defaultChecked={selectedSlugs.has(wordList.slug)}
                                    className="h-4 w-4 rounded border-[#CBD5E1]"
                                    name="wordListSlug"
                                    type="checkbox"
                                    value={wordList.slug}
                                  />
                                  {wordList.name}
                                </label>
                              ))}
                              <button
                                className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#2F80ED] px-3 text-[13px] font-semibold text-white"
                                type="submit"
                              >
                                Save lists
                              </button>
                            </form>
                          </VocabularyDisclosure>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Select({
  children,
  name,
  value,
}: {
  children: React.ReactNode;
  name: string;
  value: string;
}) {
  return (
    <select
      className="h-11 rounded-[12px] border border-[#E5E7EB] bg-white px-4 text-[14px] font-medium text-[#4B5563] outline-none"
      defaultValue={value}
      name={name}
    >
      {children}
    </select>
  );
}

function SummaryRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function countEntriesForWordList(
  entries: Array<{
    wordLists: Array<{
      wordList: {
        slug: string;
      };
    }>;
  }>,
  slug: string,
) {
  return entries.filter((entry) =>
    entry.wordLists.some((wordList) => wordList.wordList.slug === slug),
  ).length;
}

function formatVocabularyDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isAddedThisWeek(date: Date) {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  return Date.now() - date.getTime() <= oneWeekMs;
}

function getRequiredString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}

function isString(value: FormDataEntryValue): value is string {
  return typeof value === "string";
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}
