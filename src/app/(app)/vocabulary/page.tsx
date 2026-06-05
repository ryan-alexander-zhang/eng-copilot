import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  ListPlus,
  PencilLine,
  Search,
} from "lucide-react";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";
import {
  AutoSubmitSelectField,
  type AutoSubmitSelectOption,
} from "@/components/vocabulary/auto-submit-select-field";
import { InlinePopover } from "@/components/vocabulary/inline-popover";
import { VocabularyCopyButton } from "@/components/vocabulary/vocabulary-copy-button";
import { VocabularyDisclosure } from "@/components/vocabulary/vocabulary-disclosure";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOptionalFormString } from "@/lib/vocabulary/form";
import { buildVocabularyLookupLinks } from "@/lib/vocabulary/lookup-links";
import {
  importVocabularyJson,
  saveVocabularyEntry,
} from "@/lib/vocabulary/service";
import { createOwnerWordList, getOwnerCustomWordLists } from "@/lib/word-lists/service";

const PAGE_SIZE = 8;
const ACTION_BUTTON_CLASS_NAME =
  "control-icon-button h-9 w-9 rounded-[10px]";

type VocabularyPageProps = {
  searchParams: Promise<{
    page?: string;
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
        createdAt: true,
        id: true,
        note: true,
        source: true,
        word: true,
        wordLists: {
          where: {
            wordList: {
              ownerId: session.user.id,
            },
          },
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
    getOwnerCustomWordLists({
      ownerId: session.user.id,
      prisma,
    }),
  ]);
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const selectedWordListSlug = resolvedSearchParams.wordList ?? "all";
  const selectedSource = resolvedSearchParams.source ?? "all";
  const selectedSort = resolvedSearchParams.sort ?? "newest";
  const requestedPage = getPositiveInt(resolvedSearchParams.page);
  const sourceOptions = [...new Set(entries.map((entry) => entry.source))].sort();
  const wordListOptions: AutoSubmitSelectOption[] = [
    { label: "All word lists", value: "all" },
    { label: "Not in a word list", value: "none" },
    ...wordLists.map((wordList) => ({
      label: wordList.name,
      value: wordList.slug,
    })),
  ];
  const sourceFilterOptions: AutoSubmitSelectOption[] = [
    { label: "All sources", value: "all" },
    ...sourceOptions.map((source) => ({
      label: source,
      value: source,
    })),
  ];
  const sortOptions: AutoSubmitSelectOption[] = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Word A-Z", value: "word" },
  ];
  const filteredEntries = entries
    .filter((entry) => query.length === 0 || entry.word.includes(query) || entry.note.toLowerCase().includes(query))
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
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const currentViewHref = createVocabularyPageHref({
    page: currentPage,
    q: resolvedSearchParams.q,
    sort: selectedSort,
    source: selectedSource,
    wordList: selectedWordListSlug,
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
      note: getOptionalFormString(formData, "note") ?? "",
      word,
      source: "manual",
      wordListSlugs: formData.getAll("wordListSlug").filter(isString),
      prisma,
    });
    revalidatePath("/vocabulary");
    redirect("/vocabulary");
  }

  async function createWordListAction(formData: FormData) {
    "use server";

    const name = getOptionalFormString(formData, "name");

    if (name === null) {
      return;
    }

    await createOwnerWordList({
      ownerId: session.user.id,
      name,
      prisma,
    });
    revalidatePath("/vocabulary");
    revalidatePath("/word-lists");
    redirect(currentViewHref);
  }

  async function updateVocabularyEntryAction(formData: FormData) {
    "use server";

    await saveVocabularyEntry({
      entryId: getRequiredString(formData, "entryId"),
      ownerId: session.user.id,
      note: getOptionalFormString(formData, "note") ?? "",
      word: getRequiredString(formData, "word"),
      source: getRequiredString(formData, "source"),
      wordListSlugs: formData.getAll("wordListSlug").filter(isString),
      prisma,
    });
    revalidatePath("/vocabulary");
    redirect(currentViewHref);
  }

  async function updateVocabularyWordListsAction(formData: FormData) {
    "use server";

    await saveVocabularyEntry({
      entryId: getRequiredString(formData, "entryId"),
      ownerId: session.user.id,
      note: getOptionalFormString(formData, "note") ?? "",
      word: getRequiredString(formData, "word"),
      source: getRequiredString(formData, "source"),
      wordListSlugs: formData.getAll("wordListSlug").filter(isString),
      prisma,
    });
    revalidatePath("/vocabulary");
    redirect(currentViewHref);
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
    redirect(currentViewHref);
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <OwnerTopBar activeTab="vocabulary" showSearch={false} userInitial={userInitial} />

        <section className="px-6 py-8 md:px-8 md:py-10 xl:px-12">
          <div className="max-w-[1040px]">
            <h1 className="text-[36px] font-semibold tracking-[-0.06em] text-[#0F172A] md:text-[54px]">
              Vocabulary
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[#64748B] md:text-[18px]">
              Save words for review, add them to your own Word Lists, and use external links to
              look up each word. System preset lists like CET4 stay shared and read-only.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <form className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center" method="GET">
              <div className="relative min-w-0 flex-1 lg:max-w-[320px]">
                <Search
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  strokeWidth={2}
                />
                <input
                  className="field-input h-11 rounded-[14px] pl-11 pr-4 text-[14px]"
                  defaultValue={resolvedSearchParams.q ?? ""}
                  name="q"
                  placeholder="Search vocabulary..."
                  type="search"
                />
              </div>

              <AutoSubmitSelectField
                key={`wordList:${selectedWordListSlug}`}
                name="wordList"
                options={wordListOptions}
                value={selectedWordListSlug}
              />

              <AutoSubmitSelectField
                key={`source:${selectedSource}`}
                name="source"
                options={sourceFilterOptions}
                value={selectedSource}
              />

              <div className="lg:ml-auto">
                <AutoSubmitSelectField
                  key={`sort:${selectedSort}`}
                  name="sort"
                  options={sortOptions}
                  value={selectedSort}
                />
              </div>
              <button aria-label="Submit vocabulary filters" className="sr-only" type="submit" />
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <InlinePopover
                panelClassName="popover-panel absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[340px]"
                trigger="New list"
                triggerClassName="control-button h-11 px-5"
              >
                <form action={createWordListAction} className="grid gap-3">
                  <input
                    className="field-input h-11 rounded-[12px] px-4 text-[14px]"
                    name="name"
                    placeholder="Word list name"
                    required
                  />
                  <p className="text-muted text-[13px] leading-6">
                    System preset lists are shared and read-only. Saved words can only be added to
                    your custom lists.
                  </p>
                  <button
                    className="control-button control-button-primary h-10 rounded-[12px] px-4 text-[13px] font-semibold"
                    type="submit"
                  >
                    Create list
                  </button>
                </form>
              </InlinePopover>

              <InlinePopover
                panelClassName="popover-panel absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[340px]"
                trigger="Add word"
                triggerClassName="control-button control-button-primary h-11 px-5 font-semibold"
              >
                <form
                  action={addVocabularyWordAction}
                  className="grid gap-3"
                >
                  <input
                    className="field-input h-11 rounded-[12px] px-4 text-[14px]"
                    name="word"
                    placeholder="Add a word..."
                    required
                  />
                  <textarea
                    className="field-textarea min-h-[92px] rounded-[12px] px-4 py-3 text-[14px]"
                    name="note"
                    placeholder="Add a note (optional)..."
                  />
                  <p className="text-muted text-[13px] leading-6">
                    Only your custom lists can receive saved words.
                  </p>
                  <div className="grid gap-2">
                    {wordLists.map((wordList) => (
                      <label
                        className="text-soft inline-flex items-center gap-2 text-[13px]"
                        key={wordList.id}
                      >
                        <input
                          className="checkbox-accent h-4 w-4 rounded"
                          name="wordListSlug"
                          type="checkbox"
                          value={wordList.slug}
                        />
                        {wordList.name}
                      </label>
                    ))}
                  </div>
                  <button
                    className="control-button control-button-primary h-10 rounded-[12px] px-4 text-[13px] font-semibold"
                    type="submit"
                  >
                    Save word
                  </button>
                </form>
              </InlinePopover>

              <InlinePopover
                panelClassName="popover-panel absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[360px]"
                trigger="Import"
                triggerClassName="control-button h-11 px-5"
              >
                <form
                  action={importVocabularyAction}
                  className="grid gap-3"
                >
                  <p className="text-muted text-[13px] leading-6">
                    Upload a vocabulary JSON export to merge its words into your library.
                  </p>
                  <input
                    aria-label="Vocabulary JSON file"
                    accept="application/json,.json"
                    className="field-file block rounded-[12px] bg-[var(--surface-soft)] px-3 py-2 text-[13px] text-[var(--foreground-soft)] file:mr-3 file:rounded-[10px] file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-[var(--accent-strong)] hover:file:bg-[var(--surface-soft)]"
                    name="vocabularyFile"
                    required
                    type="file"
                  />
                  <button
                    className="control-button control-button-primary h-10 rounded-[12px] px-4 text-[13px] font-semibold"
                    type="submit"
                  >
                    Import JSON
                  </button>
                </form>
              </InlinePopover>

              <Link
                className="control-button h-11 px-5"
                href="/api/vocabulary"
              >
                Export
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="rounded-[18px] border border-[#E6EBF2] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <h2 className="text-[16px] font-semibold text-[#0F172A]">Overview</h2>
                <p className="mt-5 text-[14px] text-[#64748B]">Total</p>
                <p className="mt-1 text-[48px] font-semibold tracking-[-0.06em] text-[#0F172A]">
                  {entries.length}
                </p>
                <div className="mt-5 space-y-3 border-t border-[#EEF2F7] pt-5">
                  <SummaryRow color="#5A8BFF" label="In word lists" value={inWordListsCount} />
                  <SummaryRow
                    color="#D1D5DB"
                    label="Not in a word list"
                    value={entries.length - inWordListsCount}
                  />
                  <SummaryRow color="#67D38F" label="Added this week" value={addedThisWeekCount} />
                </div>
              </section>

              <section className="rounded-[18px] border border-[#E6EBF2] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <h2 className="text-[16px] font-semibold text-[#0F172A]">Word Lists</h2>
                <div className="mt-5 space-y-3">
                  {wordLists.map((wordList) => (
                    <div className="flex items-center justify-between gap-3" key={wordList.id}>
                      <span className="flex items-center gap-3 text-[14px] text-[#475569]">
                        <span
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: getWordListMeta(wordList.slug).dotColor }}
                        />
                        {wordList.name}
                      </span>
                      <span className="text-[14px] text-[#64748B]">
                        {countEntriesForWordList(entries, wordList.slug)}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  className="link-accent mt-5 inline-flex text-[14px] font-medium"
                  href="/word-lists"
                >
                  View all word lists →
                </Link>
              </section>

              <section className="rounded-[18px] border border-[#E6EBF2] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <h2 className="text-[16px] font-semibold text-[#0F172A]">How it works</h2>
                <div className="mt-5 space-y-4">
                  <HowItWorksStep index={1}>Save a word</HowItWorksStep>
                  <HowItWorksStep index={2}>Add it to a Word List</HowItWorksStep>
                  <HowItWorksStep index={3}>
                    It becomes eligible for document highlighting
                  </HowItWorksStep>
                </div>
              </section>
            </aside>

            <section className="overflow-visible rounded-[20px] border border-[#E6EBF2] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)] xl:self-start">
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-[#FBFCFF] text-left text-[13px] font-medium text-[#64748B]">
                      <th className="w-12 border-b border-[#EEF2F7] px-4 py-4">
                        <input
                          aria-label="Select all vocabulary entries"
                          className="checkbox-accent h-4 w-4 rounded"
                          type="checkbox"
                        />
                      </th>
                      <th className="border-b border-[#EEF2F7] px-4 py-4">Word</th>
                      <th className="border-b border-[#EEF2F7] px-4 py-4">Added</th>
                      <th className="border-b border-[#EEF2F7] px-4 py-4">Word List</th>
                      <th className="border-b border-[#EEF2F7] px-4 py-4">Note</th>
                      <th className="border-b border-[#EEF2F7] px-4 py-4">Lookup links</th>
                      <th className="border-b border-[#EEF2F7] px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEntries.length === 0 ? (
                      <tr>
                        <td className="px-6 py-12 text-center text-[15px] text-[#64748B]" colSpan={7}>
                          No vocabulary matched this view.
                        </td>
                      </tr>
                    ) : null}
                    {visibleEntries.map((entry) => {
                      const entryWordLists = entry.wordLists.map((wordList) => wordList.wordList);
                      const selectedSlugs = new Set(entryWordLists.map((wordList) => wordList.slug));

                      return (
                        <tr className="text-[14px] text-[#475569]" key={entry.id}>
                          <td className="border-b border-[#EEF2F7] px-4 py-4 align-top">
                            <input
                              aria-label={`Select ${entry.word}`}
                              className="checkbox-accent mt-1 h-4 w-4 rounded"
                              type="checkbox"
                            />
                          </td>
                          <td className="border-b border-[#EEF2F7] px-4 py-4 align-top">
                            <span className="text-[16px] font-semibold text-[#0F172A]">{entry.word}</span>
                          </td>
                          <td className="border-b border-[#EEF2F7] px-4 py-4 align-top text-[#64748B]">
                            {formatVocabularyDate(entry.createdAt)}
                          </td>
                          <td className="border-b border-[#EEF2F7] px-4 py-4 align-top">
                            {entryWordLists.length === 0 ? (
                              <span className="inline-flex rounded-full bg-[#F1F5F9] px-3 py-1 text-[12px] font-semibold text-[#64748B]">
                                Not in list
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {entryWordLists.map((wordList) => {
                                  const wordListMeta = getWordListMeta(wordList.slug);

                                  return (
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${wordListMeta.badgeClassName}`}
                                      key={wordList.id}
                                    >
                                      {wordList.name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="max-w-[260px] border-b border-[#EEF2F7] px-4 py-4 align-top text-[#64748B]">
                            {entry.note.length > 0 ? entry.note : "—"}
                          </td>
                          <td className="border-b border-[#EEF2F7] px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-x-3 gap-y-2">
                              {buildVocabularyLookupLinks(entry.word).map((link) => (
                                <a
                                  aria-label={`${link.label} lookup for ${entry.word}`}
                                  className="control-icon-button group relative h-8 w-8 rounded-[10px]"
                                  href={link.href}
                                  key={link.href}
                                  rel="noreferrer"
                                  target="_blank"
                                  title={link.label}
                                >
                                  <img
                                    alt=""
                                    aria-hidden="true"
                                    className="h-4 w-4 rounded-[3px]"
                                    height={16}
                                    src={link.iconSrc}
                                    width={16}
                                  />
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-[#0F172A] px-2 py-1 text-[12px] font-medium text-white opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition group-hover:opacity-100 group-focus:opacity-100"
                                  >
                                    {link.label}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </td>
                          <td className="relative overflow-visible border-b border-[#EEF2F7] px-4 py-4 align-top">
                            <div className="flex items-center gap-2">
                              <VocabularyDisclosure
                                className="relative"
                                trigger={
                                  <>
                                    <ListPlus aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                                    <span className="sr-only">Manage word lists for {entry.word}</span>
                                  </>
                                }
                                triggerClassName={ACTION_BUTTON_CLASS_NAME}
                              >
                                <form
                                  action={updateVocabularyWordListsAction}
                                  className="popover-panel absolute right-0 top-11 z-30 grid w-[220px] gap-3 p-3"
                                >
                                  <input name="entryId" type="hidden" value={entry.id} />
                                  <input name="note" type="hidden" value={entry.note} />
                                  <input name="source" type="hidden" value={entry.source} />
                                  <input name="word" type="hidden" value={entry.word} />
                                  <p className="text-muted text-[12px] leading-5">
                                    Saved words can only be attached to your custom lists.
                                  </p>
                                  {wordLists.map((wordList) => (
                                    <label
                                      className="text-soft flex items-center gap-2 text-[13px]"
                                      key={wordList.id}
                                    >
                                      <input
                                        defaultChecked={selectedSlugs.has(wordList.slug)}
                                        className="checkbox-accent h-4 w-4 rounded"
                                        name="wordListSlug"
                                        type="checkbox"
                                        value={wordList.slug}
                                      />
                                      {wordList.name}
                                    </label>
                                  ))}
                                  <button
                                    className="control-button control-button-primary h-9 rounded-[10px] px-3 text-[13px] font-semibold"
                                    type="submit"
                                  >
                                    Save lists
                                  </button>
                                </form>
                              </VocabularyDisclosure>

                              <VocabularyCopyButton className={ACTION_BUTTON_CLASS_NAME} word={entry.word} />

                              <VocabularyDisclosure
                                className="relative"
                                trigger={
                                  <>
                                    <PencilLine aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                                    <span className="sr-only">Edit {entry.word}</span>
                                  </>
                                }
                                triggerClassName={ACTION_BUTTON_CLASS_NAME}
                              >
                                <form
                                  action={updateVocabularyEntryAction}
                                  className="popover-panel absolute right-0 top-11 z-30 grid w-[340px] gap-3"
                                >
                                  <input name="entryId" type="hidden" value={entry.id} />
                                  <input name="source" type="hidden" value={entry.source} />
                                  <input
                                    className="field-input h-11 rounded-[12px] px-4 text-[14px]"
                                    defaultValue={entry.word}
                                    name="word"
                                    required
                                  />
                                  <textarea
                                    className="field-textarea min-h-[92px] rounded-[12px] px-4 py-3 text-[14px]"
                                    defaultValue={entry.note}
                                    name="note"
                                    placeholder="Add a note..."
                                  />
                                  <p className="text-muted text-[12px] leading-5">
                                    Saved words can only be attached to your custom lists.
                                  </p>
                                  <div className="grid gap-2">
                                    {wordLists.map((wordList) => (
                                      <label
                                        className="text-soft flex items-center gap-2 text-[13px]"
                                        key={wordList.id}
                                      >
                                        <input
                                          defaultChecked={selectedSlugs.has(wordList.slug)}
                                          className="checkbox-accent h-4 w-4 rounded"
                                          name="wordListSlug"
                                          type="checkbox"
                                          value={wordList.slug}
                                        />
                                        {wordList.name}
                                      </label>
                                    ))}
                                  </div>
                                  <button
                                    className="control-button control-button-primary h-10 rounded-[12px] px-4 text-[13px] font-semibold"
                                    type="submit"
                                  >
                                    Save changes
                                  </button>
                                </form>
                              </VocabularyDisclosure>

                              <button
                                aria-label={`More actions for ${entry.word}`}
                                className={ACTION_BUTTON_CLASS_NAME}
                                type="button"
                              >
                                <Ellipsis aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-2 border-t border-[#EEF2F7] px-4 py-5">
                  <PaginationLink
                    currentPage={currentPage}
                    page={Math.max(1, currentPage - 1)}
                    searchParams={resolvedSearchParams}
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  </PaginationLink>
                  {getVisiblePageNumbers(currentPage, totalPages).map((pageNumber) => (
                    <PaginationLink
                      currentPage={currentPage}
                      key={pageNumber}
                      page={pageNumber}
                      searchParams={resolvedSearchParams}
                    >
                      {pageNumber}
                    </PaginationLink>
                  ))}
                  <PaginationLink
                    currentPage={currentPage}
                    page={Math.min(totalPages, currentPage + 1)}
                    searchParams={resolvedSearchParams}
                  >
                    <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  </PaginationLink>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </main>
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
    <div className="flex items-center justify-between gap-3 text-[14px] text-[#475569]">
      <span className="flex items-center gap-3">
        <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-[#64748B]">{value}</span>
    </div>
  );
}

function HowItWorksStep({ children, index }: { children: ReactNode; index: number }) {
  return (
    <div className="flex items-start gap-3">
      <span className="step-badge h-7 w-7 text-[13px]">
        {index}
      </span>
      <span className="max-w-[170px] text-[14px] leading-6 text-[#475569]">{children}</span>
    </div>
  );
}

function PaginationLink({
  children,
  currentPage,
  page,
  searchParams,
}: {
  children: ReactNode;
  currentPage: number;
  page: number;
  searchParams: {
    page?: string;
    q?: string;
    sort?: string;
    source?: string;
    wordList?: string;
  };
}) {
  const isActive = currentPage === page;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`pagination-link h-10 min-w-10 rounded-[12px] px-3 text-[14px] ${
        isActive ? "pagination-link-active" : ""
      }`}
      href={createVocabularyPageHref({
        page,
        q: searchParams.q,
        sort: searchParams.sort,
        source: searchParams.source,
        wordList: searchParams.wordList,
      })}
    >
      {children}
    </Link>
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

function getPositiveInt(value: string | undefined) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, startPage + 4);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}

function getWordListMeta(slug: string) {
  const bySlug: Record<
    string,
    {
      badgeClassName: string;
      dotColor: string;
    }
  > = {
    cet4: {
      badgeClassName: "bg-[#EAF2FF] text-[#3B82F6]",
      dotColor: "#5A8BFF",
    },
    cet6: {
      badgeClassName: "bg-[#F1E9FF] text-[#8B5CF6]",
      dotColor: "#9A6BFF",
    },
    ielts: {
      badgeClassName: "bg-[#FFF0E3] text-[#F59E0B]",
      dotColor: "#FF9D3A",
    },
    toefl: {
      badgeClassName: "bg-[#E5FBFA] text-[#0EA5A4]",
      dotColor: "#68D4CF",
    },
  };

  return (
    bySlug[slug] ?? {
      badgeClassName: "bg-[#FCE7F3] text-[#EC4899]",
      dotColor: "#F78BC8",
    }
  );
}

function createVocabularyPageHref(input: {
  page: number;
  q?: string;
  sort?: string;
  source?: string;
  wordList?: string;
}) {
  const params = new URLSearchParams();

  if (input.q && input.q.trim().length > 0) {
    params.set("q", input.q);
  }

  if (input.wordList && input.wordList !== "all") {
    params.set("wordList", input.wordList);
  }

  if (input.source && input.source !== "all") {
    params.set("source", input.source);
  }

  if (input.sort && input.sort !== "newest") {
    params.set("sort", input.sort);
  }

  if (input.page > 1) {
    params.set("page", String(input.page));
  }

  const query = params.toString();

  return query.length > 0 ? `/vocabulary?${query}` : "/vocabulary";
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
