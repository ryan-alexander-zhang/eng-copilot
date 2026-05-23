# React Markdown Projection Reader Implementation Plan

**Goal:** Upgrade the document reader from the current hand-built block renderer to a `react-markdown`-based semantic renderer while preserving the existing annotation anchor contract, persisted highlights, search scrolling, and selection-to-offset mapping.

**Architecture:** Keep `rawMarkdown` as the rendering source of truth and keep persisted `DocumentBlock + startOffset/endOffset` as the interaction source of truth. Replace the current shallow Markdown parsing module with a deeper projection module that derives stable text-bearing blocks from the Markdown AST, persists those blocks, and reuses the same projection topology at runtime to inject interactive text slices into the rendered Markdown tree.

**Tech Stack Changes:** Add `react-markdown` and `remark-gfm`. Do not adopt `rehype-raw` in this phase. Keep `next`, `react`, `prisma`, and the existing annotation tables unchanged.

## Scope Check

This plan is one coherent subsystem change:

- Markdown parsing and projection
- projection persistence and migration
- semantic Markdown rendering
- annotation and search interaction preservation
- shared and owner reader reuse

Do not split this plan into multiple files yet.

## Non-Goals

- Rendering raw HTML inside Markdown
- Image-level or Mermaid-graph-level annotations
- Editing uploaded document source in place
- Replacing the current annotation table contract
- Shipping full Mermaid runtime rendering in the same change set

## Planned Module Split

### Persistence And Domain Model

- `prisma/schema.prisma`: add projection metadata to `Document` and `DocumentBlock`
- `src/lib/documents/create-document-from-upload.ts`: persist V2 projection blocks
- `src/lib/documents/get-owner-document.ts`: read V2 block metadata
- `src/lib/documents/get-shared-document.ts`: read V2 block metadata
- `scripts/backfill-render-projection-v2.ts`: reparse old documents and recompute highlights

### Markdown Projection

- `src/lib/markdown/types.ts`: shared projection and run types
- `src/lib/markdown/parse-markdown-ast.ts`: unified Markdown AST parsing stack
- `src/lib/markdown/collect-projection-nodes.ts`: collect text-bearing AST nodes into projection node descriptors
- `src/lib/markdown/build-render-projection.ts`: assign `blockKey`, `sortOrder`, and V2 block metadata
- `src/lib/markdown/parse-markdown-to-render-projection.ts`: upload-time projection entry point

### Runtime Rendering

- `src/lib/markdown/build-block-runs.ts`: merge highlight, search, and annotation ranges into non-overlapping runs
- `src/lib/markdown/remark-attach-projection-metadata.ts`: reattach persisted block metadata to the runtime AST
- `src/components/documents/document-markdown-preview.tsx`: `react-markdown` wrapper and block-level rendering adapter
- `src/components/documents/projected-inline-renderer.tsx`: recursive inline renderer that slices text leaves into interactive spans
- `src/components/documents/mermaid-block.tsx`: reserved seam for future Mermaid rendering

### Reader Shell And Tests

- `src/components/documents/document-reader.tsx`: keep reader shell and selection mapping, replace inline rendering implementation
- `tests/unit/markdown/*.test.ts`: projection, run builder, metadata attachment
- `tests/unit/documents/document-reader.test.tsx`: rich Markdown selection and annotation behavior
- `tests/e2e/owner-upload-and-share.spec.ts`: owner and shared reader regression coverage

## Data Model Changes

### Document

- Add `renderProjectionVersion Int @default(2)`

### DocumentBlock

- Add `blockPath String`
- Add `selectable Boolean @default(true)`
- Add `attrs Json?`

### Projection Block Shape

```ts
export type ProjectionBlockKind = "heading" | "paragraph" | "code" | "table-cell";

export type ProjectionBlockAttrs = {
  depth?: number;
  ordered?: boolean;
  listDepth?: number;
  listStart?: number;
  blockquoteDepth?: number;
  language?: string | null;
  tableColumnAlign?: "left" | "center" | "right" | null;
};

export type ProjectionBlock = {
  blockKey: string;
  blockPath: string;
  sortOrder: number;
  kind: ProjectionBlockKind;
  text: string;
  selectable: boolean;
  attrs: ProjectionBlockAttrs | null;
};
```

### Interaction Run Shape

```ts
export type BlockRun = {
  startOffset: number;
  endOffset: number;
  highlightTerms: string[];
  searchMatchIds: string[];
  annotationIds: string[];
  annotationColor?: string | null;
};
```

## Invariants

- Offsets stay anchored to visible text, not Markdown source positions.
- `blockKey + startOffset + endOffset` remains the persisted annotation interface.
- Upload-time projection and render-time projection must share the same AST traversal rules.
- Only text-bearing blocks are persisted as annotation anchor surfaces.
- Non-text widgets such as images and Mermaid blocks may render, but are non-selectable in this phase.

## Task 1: Add V2 Projection Schema And Shared Types

**Files:**
- Update: `prisma/schema.prisma`
- Create: `src/lib/markdown/types.ts`

- [ ] Add `renderProjectionVersion` to `Document`
- [ ] Add `blockPath`, `selectable`, and `attrs` to `DocumentBlock`
- [ ] Define shared projection and run types in one module
- [ ] Verify: `npm run db:generate`

## Task 2: Build The Projection Parser Stack

**Files:**
- Update: `package.json`
- Update: `package-lock.json`
- Create: `src/lib/markdown/parse-markdown-ast.ts`
- Create: `src/lib/markdown/collect-projection-nodes.ts`
- Create: `src/lib/markdown/build-render-projection.ts`
- Create: `src/lib/markdown/parse-markdown-to-render-projection.ts`
- Test: `tests/unit/markdown/parse-markdown-to-render-projection.test.ts`

- [ ] Install `react-markdown` and `remark-gfm`
- [ ] Parse Markdown through one centralized AST entry point
- [ ] Collect text-bearing blocks with stable `blockPath` descriptors
- [ ] Preserve visible text projection for headings, paragraphs, code blocks, and table cells
- [ ] Carry semantic attrs such as heading depth and code language without changing the offset coordinate system
- [ ] Keep `blockKey` generation compatible with the current visible-text hashing contract where possible
- [ ] Verify: `npm run test -- tests/unit/markdown/parse-markdown-to-render-projection.test.ts`

## Task 3: Switch Upload Persistence To Projection V2

**Files:**
- Update: `src/lib/documents/create-document-from-upload.ts`
- Update: `tests/unit/documents/create-document-from-upload.test.ts`
- Update: `tests/unit/highlights/compute-highlight-matches.test.ts`

- [ ] Replace `parseMarkdownToBlocks` with `parseMarkdownToRenderProjection`
- [ ] Persist `blockPath`, `selectable`, `attrs`, and `renderProjectionVersion`
- [ ] Keep highlight computation based on `block.text`
- [ ] Preserve existing upload validation behavior
- [ ] Verify: `npm run test -- tests/unit/documents/create-document-from-upload.test.ts tests/unit/highlights/compute-highlight-matches.test.ts`

## Task 4: Replace The Slice Builder With A Sweep-Line Run Builder

**Files:**
- Create: `src/lib/markdown/build-block-runs.ts`
- Test: `tests/unit/markdown/build-block-runs.test.ts`

- [ ] Replace the current per-slice repeated filtering logic with a sweep-line implementation
- [ ] Merge highlight, search, and annotation ranges into non-overlapping runs
- [ ] Preserve visual precedence: annotation over active search, active search over passive search, passive search over highlight
- [ ] Keep output compatible with the current selection mapping contract
- [ ] Verify: `npm run test -- tests/unit/markdown/build-block-runs.test.ts`

## Task 5: Attach Persisted Projection Metadata To The Runtime Markdown Tree

**Files:**
- Create: `src/lib/markdown/remark-attach-projection-metadata.ts`
- Test: `tests/unit/markdown/remark-attach-projection-metadata.test.ts`

- [ ] Rebuild the runtime AST from `rawMarkdown` using the same parser stack as upload-time projection
- [ ] Match persisted blocks back onto runtime nodes through `blockPath`
- [ ] Attach `data-block-key`, `data-block-path`, and `data-selectable-block` metadata to matching nodes
- [ ] Fail loudly in tests if runtime traversal order diverges from upload traversal order
- [ ] Verify: `npm run test -- tests/unit/markdown/remark-attach-projection-metadata.test.ts`

## Task 6: Introduce A React Markdown Preview Module

**Files:**
- Create: `src/components/documents/document-markdown-preview.tsx`
- Create: `src/components/documents/projected-inline-renderer.tsx`
- Create: `src/components/documents/mermaid-block.tsx`
- Test: `tests/unit/documents/document-markdown-preview.test.tsx`

- [ ] Render `rawMarkdown` through `react-markdown` and `remark-gfm`
- [ ] Override block renderers so text-bearing blocks render through `ProjectedInlineRenderer`
- [ ] Slice only text leaves into `span[data-slice-start][data-slice-end]`
- [ ] Preserve semantic inline markup such as links, emphasis, strong, and inline code
- [ ] Treat Mermaid fences as a dedicated seam without making them selectable in this phase
- [ ] Render images and other non-text widgets without breaking text selection around them
- [ ] Verify: `npm run test -- tests/unit/documents/document-markdown-preview.test.tsx`

## Task 7: Convert DocumentReader Into An Interaction Shell

**Files:**
- Update: `src/components/documents/document-reader.tsx`
- Update: `tests/unit/documents/document-reader.test.tsx`
- Update: `tests/unit/annotations/build-annotation-segments.test.ts`

- [ ] Keep `buildAnnotationSegments`, `getSelectionDraft`, `resolveSelectionPoint`, context menu, dialog, and footer behavior
- [ ] Remove the current block-level JSX switch and inline slice renderer
- [ ] Delegate body rendering to `DocumentMarkdownPreview`
- [ ] Keep search scrolling based on `data-search-match-id`
- [ ] Keep selection mapping based on the nearest `data-slice-start` and `data-slice-end`
- [ ] Verify: `npm run test -- tests/unit/documents/document-reader.test.tsx tests/unit/annotations/build-annotation-segments.test.ts`

## Task 8: Read V2 Projection In Owner And Shared Views

**Files:**
- Update: `src/lib/documents/get-owner-document.ts`
- Update: `src/lib/documents/get-shared-document.ts`
- Update: `src/components/documents/document-workspace.tsx`
- Update: `src/components/documents/shared-document-shell.tsx`

- [ ] Read `blockPath`, `selectable`, and `attrs` with the existing document read models
- [ ] Pass `rawMarkdown`, persisted blocks, highlights, and annotations to the new preview module
- [ ] Keep owner and shared readers visually and behaviorally consistent
- [ ] Verify: `npm run test -- tests/unit/documents/shared-document-shell.test.tsx tests/unit/documents/document-workspace.test.tsx`

## Task 9: Backfill Existing Documents To Projection V2

**Files:**
- Create: `scripts/backfill-render-projection-v2.ts`
- Update: `package.json`
- Update: `docs/operations/README.md`

- [ ] Reparse every stored document from `rawMarkdown`
- [ ] Replace old `DocumentBlock` rows with V2 projection blocks
- [ ] Recompute and persist highlight matches after the projection rewrite
- [ ] Set `renderProjectionVersion = 2` on migrated documents
- [ ] Make the backfill idempotent so it can be rerun safely
- [ ] Verify: run the script against a local seeded database and spot-check existing annotations in owner and shared views

## Task 10: Run Focused Regression And Rich Markdown Coverage

**Files:**
- Update: `tests/e2e/owner-upload-and-share.spec.ts`
- Update: `tests/unit/documents/document-reader.test.tsx`
- Update: `tests/unit/documents/shared-document-shell.test.tsx`

- [ ] Cover selection inside `strong`, `em`, `a`, and inline `code`
- [ ] Cover table cell rendering and selection anchoring
- [ ] Assert that links inside annotated slices do not break annotation selection
- [ ] Assert that images and Mermaid blocks do not corrupt offset mapping in neighboring text
- [ ] Verify: `npm run test` and the narrowest meaningful Playwright document-reader flow

## Dependencies And Sequencing

- Task 1 must land before all other tasks.
- Task 2 must land before Tasks 3, 5, and 9.
- Task 4 should land before Task 6 so runtime rendering uses the new run builder from the start.
- Task 6 and Task 7 should land together or behind a short-lived branch to avoid half-migrated reader behavior.
- Task 9 should land after Task 8 so the application can read V2 blocks before backfill is executed.
- Task 10 should run after all behavior changes and after at least one local backfill pass.

## Risks

### Projection Drift

The upload-time and render-time AST walkers may diverge, causing persisted `blockPath` values to no longer match runtime nodes.

Mitigation:

- Use one shared parser stack
- Use one shared projection collector
- Add dedicated tests that compare upload-time and render-time traversal output

### Anchor Drift For Existing Annotations

If `blockKey` generation changes for old documents, persisted annotation anchors may no longer line up with the same visible text.

Mitigation:

- Preserve current visible-text hash semantics where possible
- Backfill in a controlled environment first
- Spot-check old documents with annotations before broad rollout

### Over-Expanding Scope Through Mermaid

Mermaid support can turn a projection refactor into a rendering-platform rewrite if attempted in the same change.

Mitigation:

- Treat Mermaid as a dedicated seam
- Limit this phase to recognizing Mermaid blocks without making them selectable

### Link And Selection Event Conflicts

Links rendered semantically may navigate when the user is trying to select or inspect annotations.

Mitigation:

- Handle annotation click precedence at the projected slice level
- Add explicit tests for selection and click behavior inside links

## Acceptance Path

The plan is complete when all of the following are true:

- A newly uploaded Markdown document renders through `react-markdown`
- Semantic Markdown features such as headings, emphasis, strong text, links, code fences, and tables render correctly
- Annotation creation still persists `startBlockKey`, `startOffset`, `endBlockKey`, and `endOffset`
- Search highlighting and active result scrolling still work
- Owner and shared readers render the same persisted highlights and annotations
- Existing documents can be backfilled to V2 projection without losing annotation fidelity
- Mermaid and image blocks can coexist with selectable text without corrupting selection mapping

## Rollout Recommendation

- Land Tasks 1 through 5 first and keep the old reader active while tests harden the projection seam.
- Land Tasks 6 through 8 as one reader swap once projection and metadata attachment are stable.
- Run Task 9 in local and staging-like environments before any broad data migration.
- Treat Mermaid runtime rendering as a follow-up plan after this projection-based reader is stable.
