# REQ-01 Document Workspace Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the owner document workspace into a working read/annotate surface by implementing in-document search, copy/web-search selection actions, full-annotations navigation, matched-words drill-down, raw markdown viewing, and dismissible workspace guidance.

**Architecture:** Keep document data loading server-side in the existing owner document page. Add a small pure helper for reader search matching, keep interaction state in `DocumentWorkspace`, and extend `DocumentReader` to render search hits and secondary actions. Introduce one lightweight document-scoped matched-words route instead of overloading the existing reader page.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Playwright, Tailwind CSS.

---

## Scope And Assumptions

- This plan covers only the concrete MVP pieces from `REQ-01`.
- This plan intentionally excludes the ambiguous controls:
  - `Reading`
  - reader/list view toggle
  - toolbar `More`
  - `Inspect`
- Assumption: in-document search is client-side over already-loaded `blocks`.
- Assumption: `Search the web` opens Google in a new tab using the selected phrase.
- Assumption: `Dismiss` persistence is browser-session scoped via `sessionStorage`.
- Assumption: the matched-words drill-down route is `/documents/[documentId]/matched-words`.

## File Structure

- Create: `src/lib/documents/build-reader-search-matches.ts`
  - Pure helper that finds case-insensitive text matches across rendered blocks and returns ordered search hits.
- Create: `src/app/(app)/documents/[documentId]/matched-words/page.tsx`
  - Owner-only document-scoped matched-words page using existing document data and `buildMatchedWords`.
- Create: `tests/unit/documents/build-reader-search-matches.test.ts`
  - Unit coverage for search matching and result ordering.
- Create: `tests/unit/documents/matched-words-page.test.tsx`
  - Page-level assertions for the new drill-down route.
- Modify: `src/app/(app)/documents/[documentId]/page.tsx`
  - Pass `documentId`, `rawMarkdown`, and workspace deep-link targets into `DocumentWorkspace`.
- Modify: `src/components/documents/document-workspace.tsx`
  - Own search query/result index state, tip dismiss state, and navigation hrefs.
- Modify: `src/components/documents/document-reader.tsx`
  - Render search highlights, copy/search-the-web actions, raw markdown dialog, and search result scrolling.
- Modify: `src/components/documents/annotation-panel.tsx`
  - Ensure workspace panels render a real `viewAllHref` link instead of a dead button.
- Modify: `tests/unit/documents/document-workspace.test.tsx`
  - Cover search controls, matched-word navigation, and tip dismissal.
- Modify: `tests/unit/documents/document-reader.test.tsx`
  - Cover search highlighting, copy action, web-search action, and raw markdown dialog.
- Modify: `tests/unit/documents/annotation-panel.test.tsx`
  - Cover linked `View all annotations`.

## Task 1: Add Pure Reader Search Matching

**Files:**
- Create: `src/lib/documents/build-reader-search-matches.ts`
- Test: `tests/unit/documents/build-reader-search-matches.test.ts`

- [x] **Step 1: Write the failing search-helper test**

```ts
import { describe, expect, it } from "vitest";
import { buildReaderSearchMatches } from "@/lib/documents/build-reader-search-matches";

describe("buildReaderSearchMatches", () => {
  it("returns ordered case-insensitive matches across blocks", () => {
    const result = buildReaderSearchMatches({
      blocks: [
        { blockKey: "p:1", text: "Learning is valuable." },
        { blockKey: "p:2", text: "Valuable habits compound." },
      ],
      query: "valuable",
    });

    expect(result.totalCount).toBe(2);
    expect(result.matches).toEqual([
      { id: "p:1:12-20", blockKey: "p:1", startOffset: 12, endOffset: 20, text: "valuable" },
      { id: "p:2:0-8", blockKey: "p:2", startOffset: 0, endOffset: 8, text: "Valuable" },
    ]);
  });
});
```

- [x] **Step 2: Run the helper test and verify it fails**

Run: `npm test -- tests/unit/documents/build-reader-search-matches.test.ts`

Expected: FAIL because `buildReaderSearchMatches` does not exist yet.

- [x] **Step 3: Implement the minimal helper**

```ts
export function buildReaderSearchMatches(input: {
  blocks: Array<{ blockKey: string; text: string }>;
  query: string;
}) {
  const normalizedQuery = input.query.trim().toLowerCase();

  if (!normalizedQuery) {
    return { totalCount: 0, matches: [] };
  }

  const matches = input.blocks.flatMap((block) => {
    const results: Array<{
      id: string;
      blockKey: string;
      startOffset: number;
      endOffset: number;
      text: string;
    }> = [];
    const haystack = block.text.toLowerCase();
    let fromIndex = 0;

    while (fromIndex < haystack.length) {
      const matchIndex = haystack.indexOf(normalizedQuery, fromIndex);

      if (matchIndex === -1) {
        break;
      }

      const endOffset = matchIndex + normalizedQuery.length;
      results.push({
        id: `${block.blockKey}:${matchIndex}-${endOffset}`,
        blockKey: block.blockKey,
        startOffset: matchIndex,
        endOffset,
        text: block.text.slice(matchIndex, endOffset),
      });
      fromIndex = endOffset;
    }

    return results;
  });

  return {
    totalCount: matches.length,
    matches,
  };
}
```

- [x] **Step 4: Run the helper test and verify it passes**

Run: `npm test -- tests/unit/documents/build-reader-search-matches.test.ts`

Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/documents/build-reader-search-matches.ts tests/unit/documents/build-reader-search-matches.test.ts
git commit -m "feat(documents): add reader search match helper"
```

**Execution Notes**

- Red verification completed: `npm test -- tests/unit/documents/build-reader-search-matches.test.ts` failed because `buildReaderSearchMatches` did not exist yet.
- Green verification completed: `npm test -- tests/unit/documents/build-reader-search-matches.test.ts` passed after adding the helper.

## Task 2: Wire Real In-Document Search Through Workspace And Reader

**Files:**
- Modify: `src/components/documents/document-workspace.tsx`
- Modify: `src/components/documents/document-reader.tsx`
- Modify: `tests/unit/documents/document-workspace.test.tsx`
- Modify: `tests/unit/documents/document-reader.test.tsx`

- [x] **Step 1: Write failing search UX tests**

```ts
it("shows search result count and next-result navigation in the workspace", () => {
  render(
    <DocumentWorkspace
      annotations={[]}
      annotationIndexHref="/annotations?document=doc_1"
      blocks={[
        { blockKey: "paragraph:1", text: "Learning is valuable." },
        { blockKey: "paragraph:2", text: "Valuable habits compound." },
      ]}
      createAction={vi.fn().mockResolvedValue(undefined)}
      deleteAction={vi.fn().mockResolvedValue(undefined)}
      documentId="doc_1"
      enableShareAction={vi.fn().mockResolvedValue(undefined)}
      highlightMatches={[]}
      matchedWordCount={0}
      matchedWords={[]}
      matchedWordsHref="/documents/doc_1/matched-words"
      rawMarkdown="# Learning\n\nLearning is valuable."
      readingMinutes={1}
      revokeShareAction={vi.fn().mockResolvedValue(undefined)}
      share={null}
      title="Learning"
      updateAction={vi.fn().mockResolvedValue(undefined)}
      updatedLabel="Today at 10:24 AM"
      wordCount={6}
      wordLists={[]}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText("Search in document..."), {
    target: { value: "valuable" },
  });

  expect(screen.getByText("1 / 2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next search result" }));
  expect(screen.getByText("2 / 2")).toBeInTheDocument();
});

it("renders active search hits in the reader", () => {
  render(
    <DocumentReader
      activeSearchMatchId="paragraph:1:12-20"
      annotations={[]}
      blocks={[{ blockKey: "paragraph:1", text: "Learning is valuable." }]}
      highlightMatches={[]}
      searchMatches={[
        {
          id: "paragraph:1:12-20",
          blockKey: "paragraph:1",
          startOffset: 12,
          endOffset: 20,
          text: "valuable",
        },
      ]}
    />,
  );
  expect(screen.getByTestId("search-hit-active")).toBeInTheDocument();
});
```

- [x] **Step 2: Run the focused reader/workspace tests and verify they fail**

Run:

```bash
npm test -- tests/unit/documents/document-workspace.test.tsx
npm test -- tests/unit/documents/document-reader.test.tsx
```

Expected: FAIL because the workspace has no search state and the reader has no search-hit rendering.

- [x] **Step 3: Implement the search state and rendering**

```tsx
const [searchQuery, setSearchQuery] = useState("");
const searchData = useMemo(
  () => buildReaderSearchMatches({ blocks, query: searchQuery }),
  [blocks, searchQuery],
);
const [activeSearchIndex, setActiveSearchIndex] = useState(0);
const activeSearchMatch = searchData.matches[activeSearchIndex] ?? null;

<input
  onChange={(event) => {
    setSearchQuery(event.target.value);
    setActiveSearchIndex(0);
  }}
  value={searchQuery}
/>

<DocumentReader
  activeSearchMatchId={activeSearchMatch?.id ?? null}
  annotations={annotations}
  blocks={blocks}
  createAction={createAction}
  footer={{
    readingMinutes,
    updatedLabel,
    wordCount,
  }}
  highlightMatches={highlightMatches}
  onCreateDraft={(draft) => {
    setEditorState({
      draft,
      mode: "create",
    });
  }}
  onSelectAnnotation={(annotationId) => {
    setEditorState({
      annotationId,
      mode: "edit",
    });
  }}
  rawMarkdown={rawMarkdown}
  searchMatches={searchData.matches}
  title={title}
/>;
```

```tsx
function buildRenderSlices(input: {
  text: string;
  highlightMatches: ReaderHighlightMatch[];
  annotationSegments: AnnotationSegment[];
  searchMatches: Array<{ startOffset: number; endOffset: number; id: string }>;
}) {
  return slices.map((slice) => ({
    ...slice,
    searchMatchIds: input.searchMatches
      .filter((match) => match.startOffset <= slice.startOffset && slice.endOffset <= match.endOffset)
      .map((match) => match.id),
  }));
}
```

- [x] **Step 4: Re-run the focused tests and verify they pass**

Run:

```bash
npm test -- tests/unit/documents/document-workspace.test.tsx
npm test -- tests/unit/documents/document-reader.test.tsx
```

Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/components/documents/document-workspace.tsx src/components/documents/document-reader.tsx tests/unit/documents/document-workspace.test.tsx tests/unit/documents/document-reader.test.tsx
git commit -m "feat(documents): add in-document workspace search"
```

**Execution Notes**

- Red verification completed:
  - `npm test -- tests/unit/documents/document-workspace.test.tsx`
  - `npm test -- tests/unit/documents/document-reader.test.tsx`
- The failures matched the missing behavior: workspace had no `1 / 2` result state, and reader had no `search-hit-active` rendering.
- Green verification completed with the same two focused commands after wiring search state and search slice rendering.
- Regression coverage added:
  - `npm test -- tests/unit/documents/build-reader-search-matches.test.ts tests/unit/documents/document-workspace.test.tsx tests/unit/documents/document-reader.test.tsx`

## Task 3: Implement Selection Copy And Web Search Actions

**Files:**
- Modify: `src/components/documents/document-reader.tsx`
- Modify: `tests/unit/documents/document-reader.test.tsx`

- [x] **Step 1: Write failing selection-action tests**

```ts
it("copies selected text from the context menu", async () => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  render(
    <DocumentReader
      annotations={[]}
      blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
      createAction={vi.fn().mockResolvedValue(undefined)}
      highlightMatches={[]}
      searchMatches={[]}
    />,
  );
  const textSpan = screen.getByText("abcdef");
  const textNode = textSpan.firstChild;
  const range = document.createRange();

  range.setStart(textNode as Node, 1);
  range.setEnd(textNode as Node, 4);

  vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => range,
    toString: () => "bcd",
  } as unknown as Selection);

  fireEvent.contextMenu(textSpan);
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));

  await waitFor(() => {
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("bcd");
  });
});

it("opens a new tab for web search", () => {
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  render(
    <DocumentReader
      annotations={[]}
      blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
      createAction={vi.fn().mockResolvedValue(undefined)}
      highlightMatches={[]}
      searchMatches={[]}
    />,
  );
  const textSpan = screen.getByText("abcdef");
  const textNode = textSpan.firstChild;
  const range = document.createRange();

  range.setStart(textNode as Node, 1);
  range.setEnd(textNode as Node, 4);

  vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => range,
    toString: () => "bcd",
  } as unknown as Selection);

  fireEvent.contextMenu(textSpan);
  fireEvent.click(screen.getByRole("button", { name: "Search the web" }));
  expect(open).toHaveBeenCalledWith(
    "https://www.google.com/search?q=bcd",
    "_blank",
    "noopener,noreferrer",
  );
});
```

- [x] **Step 2: Run the document-reader test and verify it fails**

Run: `npm test -- tests/unit/documents/document-reader.test.tsx`

Expected: FAIL because the buttons have no handlers.

- [x] **Step 3: Implement the handlers**

```tsx
<SelectionContextMenu
  onCopy={() => void copyText(contextMenu.draft.quote)}
  onSearchWeb={() => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(contextMenu.draft.quote)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setContextMenu(null);
  }}
  onClose={() => setContextMenu(null)}
  onSelect={() => {
    if (onCreateDraft) {
      onCreateDraft(contextMenu.draft);
      setContextMenu(null);
      return;
    }

    setDialogDraft(contextMenu.draft);
    setContextMenu(null);
  }}
  quote={contextMenu.draft.quote}
  x={contextMenu.x}
  y={contextMenu.y}
/>
```

- [x] **Step 4: Re-run the document-reader test and verify it passes**

Run: `npm test -- tests/unit/documents/document-reader.test.tsx`

Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/components/documents/document-reader.tsx tests/unit/documents/document-reader.test.tsx
git commit -m "feat(documents): add reader copy and web search actions"
```

**Execution Notes**

- Red verification completed: `npm test -- tests/unit/documents/document-reader.test.tsx`
- The test failure was corrected once for an accessible-name mismatch (`Copy` vs `Copy ⌘C`), then re-run until the only remaining failures were the missing `Copy` and `Search the web` handlers.
- Green verification completed with the same focused command after wiring clipboard and `window.open` handlers.
- Regression coverage added:
  - `npm test -- tests/unit/documents/build-reader-search-matches.test.ts tests/unit/documents/document-workspace.test.tsx tests/unit/documents/document-reader.test.tsx`

## Task 4: Implement Owner Workspace Navigation And Raw Markdown View

**Files:**
- Modify: `src/app/(app)/documents/[documentId]/page.tsx`
- Modify: `src/components/documents/document-workspace.tsx`
- Modify: `src/components/documents/document-reader.tsx`
- Modify: `src/components/documents/annotation-panel.tsx`
- Modify: `tests/unit/documents/document-workspace.test.tsx`
- Modify: `tests/unit/documents/document-reader.test.tsx`
- Modify: `tests/unit/documents/annotation-panel.test.tsx`

- [x] **Step 1: Write failing tests for view-all links, raw markdown, and tip dismissal**

```ts
it("links View all annotations to the filtered annotations index", () => {
  render(
    <DocumentWorkspace
      annotations={[]}
      annotationIndexHref="/annotations?document=doc_1"
      blocks={[]}
      createAction={vi.fn().mockResolvedValue(undefined)}
      deleteAction={vi.fn().mockResolvedValue(undefined)}
      documentId="doc_1"
      enableShareAction={vi.fn().mockResolvedValue(undefined)}
      highlightMatches={[]}
      matchedWordCount={0}
      matchedWords={[]}
      matchedWordsHref="/documents/doc_1/matched-words"
      rawMarkdown="# Title"
      readingMinutes={1}
      revokeShareAction={vi.fn().mockResolvedValue(undefined)}
      share={null}
      title="Title"
      updateAction={vi.fn().mockResolvedValue(undefined)}
      updatedLabel="Today at 10:24 AM"
      wordCount={1}
      wordLists={[]}
    />,
  );
  expect(screen.getByRole("link", { name: "View all annotations" })).toHaveAttribute(
    "href",
    "/annotations?document=doc_1",
  );
});

it("opens a raw markdown dialog from the reader footer", () => {
  render(
    <DocumentReader
      annotations={[]}
      blocks={[{ blockKey: "paragraph:1", text: "Paragraph" }]}
      footer={{
        readingMinutes: 1,
        updatedLabel: "Today at 10:24 AM",
        wordCount: 1,
      }}
      highlightMatches={[]}
      rawMarkdown="# Title"
      searchMatches={[]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Open raw Markdown/ }));
  expect(screen.getByRole("dialog")).toHaveTextContent("# Title");
});

it("hides the tip after dismissing it", () => {
  render(
    <DocumentWorkspace
      annotations={[
        {
          id: "annotation-1",
          color: "yellow",
          createdAt: new Date("2026-04-24T10:24:00.000Z"),
          endBlockKey: "paragraph:1",
          endOffset: 10,
          note: "Important note.",
          quote: "Learning is valuable.",
          startBlockKey: "paragraph:1",
          startOffset: 0,
          tags: [],
          updatedAt: new Date("2026-04-24T10:24:00.000Z"),
        },
      ]}
      annotationIndexHref="/annotations?document=doc_1"
      blocks={[{ blockKey: "paragraph:1", text: "Learning is valuable." }]}
      createAction={vi.fn().mockResolvedValue(undefined)}
      deleteAction={vi.fn().mockResolvedValue(undefined)}
      documentId="doc_1"
      enableShareAction={vi.fn().mockResolvedValue(undefined)}
      highlightMatches={[]}
      initialSelectedAnnotationId="annotation-1"
      matchedWordCount={0}
      matchedWords={[]}
      matchedWordsHref="/documents/doc_1/matched-words"
      rawMarkdown="# Learning"
      readingMinutes={1}
      revokeShareAction={vi.fn().mockResolvedValue(undefined)}
      share={null}
      title="Learning"
      updateAction={vi.fn().mockResolvedValue(undefined)}
      updatedLabel="Today at 10:24 AM"
      wordCount={3}
      wordLists={[]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByText("Tip")).not.toBeInTheDocument();
});
```

- [x] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
npm test -- tests/unit/documents/document-workspace.test.tsx
npm test -- tests/unit/documents/document-reader.test.tsx
```

Expected: FAIL because the workspace does not pass real hrefs, the raw-markdown button does not open anything, and dismiss is not persisted.

- [x] **Step 3: Implement the navigation props and modal**

```tsx
<DocumentWorkspace
  annotationIndexHref={`/annotations?document=${document.id}`}
  documentId={document.id}
  matchedWordsHref={`/documents/${document.id}/matched-words`}
  rawMarkdown={document.rawMarkdown}
  annotations={document.annotations}
  blocks={document.blocks}
  createAction={createAnnotationAction}
  deleteAction={deleteAnnotationAction}
  enableShareAction={enableShareAction}
  highlightMatches={document.highlightMatches}
  initialSelectedAnnotationId={initialSelectedAnnotationId}
  matchedWordCount={matchedWordCount}
  matchedWords={matchedWordItems}
  readingMinutes={readingMinutes}
  revokeShareAction={revokeShareAction}
  share={document.share}
  title={document.title}
  updateAction={updateAnnotationAction}
  updatedLabel={formatDateTimeLabel(document.updatedAt)}
  wordCount={wordCount}
  wordLists={buildReaderWordLists(
    userWordListPrefs.map((preference) => preference.wordList.slug),
  )}
/>;
```

```tsx
const [isRawMarkdownOpen, setIsRawMarkdownOpen] = useState(false);
const [isTipDismissed, setIsTipDismissed] = useState(false);

useEffect(() => {
  setIsTipDismissed(window.sessionStorage.getItem("document-workspace-tip-dismissed") === "1");
}, []);
```

- [x] **Step 4: Re-run the focused tests and verify they pass**

Run:

```bash
npm test -- tests/unit/documents/document-workspace.test.tsx
npm test -- tests/unit/documents/document-reader.test.tsx
```

Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/app/'(app)'/documents/[documentId]/page.tsx src/components/documents/document-workspace.tsx src/components/documents/document-reader.tsx tests/unit/documents/document-workspace.test.tsx tests/unit/documents/document-reader.test.tsx
git commit -m "feat(documents): add workspace navigation affordances"
```

**Execution Notes**

- Red verification completed:
  - `npm test -- tests/unit/documents/document-workspace.test.tsx`
  - `npm test -- tests/unit/documents/document-reader.test.tsx`
- One raw-markdown assertion was tightened once from an exact accessible name to `/Open raw Markdown/`, then re-run until the remaining failures mapped only to the missing dialog, missing workspace links, and missing dismiss persistence.
- Green verification completed with the same two focused commands after wiring the page props, workspace links, raw-markdown dialog, and tip dismissal state.
- Regression coverage added:
  - `npm test -- tests/unit/documents/build-reader-search-matches.test.ts tests/unit/documents/document-workspace.test.tsx tests/unit/documents/document-reader.test.tsx`
- Additional type-layer verification attempted:
  - `./node_modules/.bin/tsc --noEmit`
  - `./node_modules/.bin/tsc --noEmit --ignoreDeprecations 6.0`
- Type checking remains blocked by pre-existing repository errors outside this task, including `shared-document-shell.tsx`, several auth tests, and multiple existing document-page test fixtures. No new type errors were surfaced against the Task 4 files.

## Task 5: Add The Matched-Words Drill-Down Route

**Files:**
- Create: `src/app/(app)/documents/[documentId]/matched-words/page.tsx`
- Create: `tests/unit/documents/matched-words-page.test.tsx`
- Modify: `src/components/documents/document-workspace.tsx`

- [x] **Step 1: Write the failing route test**

```ts
it("renders all matched words for the owner document", async () => {
  render(
    await MatchedWordsPage({
      params: Promise.resolve({ documentId: "doc_1" }),
      searchParams: Promise.resolve({}),
    }),
  );

  expect(screen.getByRole("heading", { name: "Matched words" })).toBeInTheDocument();
  expect(screen.getByText("valuable")).toBeInTheDocument();
  expect(screen.getByText("CET4")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});
```

- [x] **Step 2: Run the new page test and verify it fails**

Run: `npm test -- tests/unit/documents/matched-words-page.test.tsx`

Expected: FAIL because the route does not exist yet.

- [x] **Step 3: Implement the page with existing helpers**

```tsx
const { matchedWords } = buildMatchedWords({
  activeWordLists,
  highlightMatches: document.highlightMatches,
});

return (
  <main>
    <OwnerTopBar activeTab="documents" userInitial={userInitial} />
    <section>
      <Link href={`/documents/${document.id}`}>Back to document</Link>
      <h1>Matched words</h1>
      {matchedWords.map((match) => (
        <div key={match.term}>
          <span>{match.term}</span>
          <span>{match.listName ?? "-"}</span>
          <span>{match.count}</span>
        </div>
      ))}
    </section>
  </main>
);
```

- [x] **Step 4: Re-run the page test and the word-count regression test**

Run:

```bash
npm test -- tests/unit/documents/matched-words-page.test.tsx
npm test -- tests/unit/documents/build-matched-words.test.ts
```

Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/app/'(app)'/documents/[documentId]/matched-words/page.tsx tests/unit/documents/matched-words-page.test.tsx
git commit -m "feat(documents): add matched words drill-down page"
```

**Execution Notes**

- Red verification completed: `npm test -- tests/unit/documents/matched-words-page.test.tsx`
- The first red state was the missing route file. After implementation, one link assertion was tightened from an exact accessible name to `/Back to document/`, then re-run until the page test was green for the real behavior.
- Green verification completed:
  - `npm test -- tests/unit/documents/matched-words-page.test.tsx`
  - `npm test -- tests/unit/documents/build-matched-words.test.ts`

## Task 6: Final Regression Sweep

**Files:**
- No new source files expected unless regressions require targeted fixes.

- [x] **Step 1: Run the unit regression set for document workspace flows**

Run:

```bash
npm test -- tests/unit/documents/build-reader-search-matches.test.ts
npm test -- tests/unit/documents/build-matched-words.test.ts
npm test -- tests/unit/documents/document-workspace.test.tsx
npm test -- tests/unit/documents/document-reader.test.tsx
npm test -- tests/unit/documents/annotation-panel.test.tsx
npm test -- tests/unit/documents/matched-words-page.test.tsx
```

Expected: PASS

- [x] **Step 2: Run broader related regression**

Run:

```bash
npm test -- tests/unit/documents/library-pages.test.tsx
npm test -- tests/unit/annotations/build-annotation-segments.test.ts
```

Expected: PASS

- [x] **Step 3: Run owner workflow E2E if app env is available**

Run: `npm run test:e2e -- tests/e2e/owner-upload-and-share.spec.ts`

Expected: PASS or SKIP with explicit missing-env message. Do not treat a prerequisite skip as a feature failure.

- [x] **Step 4: Commit only if a regression fix was required**

If Step 2 or Step 3 exposed a real regression and code changed, stage only the touched files and use:

```bash
git commit -m "test(documents): fix req-01 regression coverage"
```

**Execution Notes**

- Unit regression passed:
  - `npm test -- tests/unit/documents/build-reader-search-matches.test.ts tests/unit/documents/build-matched-words.test.ts tests/unit/documents/document-workspace.test.tsx tests/unit/documents/document-reader.test.tsx tests/unit/documents/annotation-panel.test.tsx tests/unit/documents/matched-words-page.test.tsx`
- Broader related regression passed:
  - `npm test -- tests/unit/documents/library-pages.test.tsx`
  - `npm test -- tests/unit/annotations/build-annotation-segments.test.ts`
- Owner workflow E2E required sandbox escalation so Playwright could start the local web server. After re-running with permission, the test exposed outdated test assumptions rather than product regressions:
  - old upload entry selectors
  - old annotation/highlight workflow assumptions
  - old share-link assertion
  - old sign-in page heading assertion
- After updating the E2E to match the current product flow, the end-to-end regression passed:
  - `npm run test:e2e -- tests/e2e/owner-upload-and-share.spec.ts`

## Deferred Follow-Ups

- `Reading` control product definition
- Reader/list toggle product definition
- Toolbar `More` menu definition
- `Inspect` rename and behavior definition
- Richer annotation-panel filtering beyond the `View all annotations` deep-link
