# PDF.js Text-Layer Reader Implementation Plan

## Status

- Implemented on 2026-05-27.
- Markdown and PDF now share the same persisted highlight and annotation contract through `DocumentBlock` projections and `blockKey + offset` anchors.
- Validation now covers PDF parsing, upload persistence, annotation anchor persistence, component-level PDF preview rendering, and owner/shared PDF reader flows.
- Remaining non-goals are unchanged: OCR, scanned-PDF fallback, and image-level annotations.

## Summary

- Goal: add PDF upload and reading with the same study-layer guarantees as Markdown for text-based PDFs only: searchable text, persisted vocabulary highlights, persisted annotations, owner/shared parity, and stable selection anchoring.
- Rendering source of truth: original PDF bytes rendered with `PDF.js`.
- Interaction source of truth: persisted per-page text projection plus offset-based anchors.
- Selection basis: runtime PDF text layer built from `textContent`.
- Replay basis: app-owned highlight and annotation overlay on top of each page.

## Chosen Defaults

- PDF storage: Postgres `Bytes`
- Scan rejection: coverage-threshold heuristic
- No OCR in v1
- No scanned-PDF fallback
- No password-protected PDFs
- No image-level annotations

## Public Interface And Data Model Changes

- Add `Document.sourceFormat` enum: `MARKDOWN | PDF`
- Change `Document.rawMarkdown` to nullable and keep it only for Markdown documents
- Add `Document.plainText String @default("") @db.Text`
- Add `Document.sourceByteSize Int @default(0)`
- Add `Document.pdfData Bytes?`
- Keep `Document.renderProjectionVersion`; use `2` for current Markdown docs and `3` for initial PDF projection
- Keep `DocumentBlock` as the canonical interaction projection table
- For PDF docs, persist one `DocumentBlock` per page:
  - `kind = "pdf-page"`
  - `blockPath = "page:<pageNumber>"`
  - `text = extracted page plain text in reading order`
  - `attrs = { pageNumber, width, height, rotation }`
- Extend `Annotation` with `anchorData Json?`
- Keep `Annotation.startBlockKey`, `startOffset`, `endBlockKey`, `endOffset`, and `quote` as the authoritative text anchor for both formats
- Use this PDF anchor payload:

```ts
type PdfAnnotationAnchor = {
  kind: "pdf-page-text-v1";
  startPageNumber: number;
  startRunIndex: number;
  endPageNumber: number;
  endRunIndex: number;
  rects: Array<{
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};
```

## Implementation Changes

### Upload And Persistence

- Update `src/lib/documents/create-document-from-upload.ts` into a format dispatcher
- Add `src/lib/pdf/parse-pdf-to-page-projection.ts` as the upload-time parser
- Add `src/lib/pdf/build-pdf-page-text.ts` as the shared normalization function used by both upload-time and runtime text-layer mapping
- Parse PDF with `pdfjsLib.getDocument({ data: Uint8Array, stopAtErrors: true })`
- For each page, call `PDFPageProxy.getTextContent()` and build page text by iterating `TextContent.items` in order, normalizing whitespace exactly once, and inserting line breaks only from `hasEOL`
- Persist one page block per page, ordered by page number
- Set `Document.plainText` to `blocks.map((block) => block.text).join("\n\n")`
- Set `Document.sourceByteSize` to the uploaded file size in bytes
- Persist `Document.pdfData` with the original bytes
- Reuse `computeHighlightMatches` unchanged against the page blocks

### Scan Detection And Upload Validation

- Accept `.md`, `.markdown`, `.mdown`, `.mkd`, and `.pdf`
- Keep one upload size limit for both formats: `10 MB`
- Reject password-protected or encrypted PDFs with a clear validation error
- Reject PDFs that fail parsing before any row is created
- Define a page as text-bearing when `nonWhitespaceChars >= 24 || textItems >= 6`
- Define allowed non-text pages as `max(1, floor(totalPages * 0.1))`
- Reject the upload when `nonTextPages > allowedNonTextPages`
- Use this validation error: `Scanned PDFs are not supported yet; upload a text-based PDF instead`

### Reader And Overlay Architecture

- Keep `DocumentReader` as the interaction shell
- Branch inside `DocumentReader` by `sourceFormat`
- Add `src/components/documents/document-pdf-preview.tsx`
- `DocumentPdfPreview` responsibilities:
  - fetch the PDF bytes from a protected route
  - initialize the `PDF.js` worker
  - render each page canvas
  - rebuild runtime text-layer runs from `getTextContent()` using the same `build-pdf-page-text` logic as upload-time parsing
  - assign `data-block-key` as the page block key and `data-slice-start/end` as page-level offsets
  - assign `data-run-index` per runtime text run for PDF-only anchor metadata
- Render app-owned overlay layers per page:
  - highlight overlay for persisted vocabulary matches
  - search overlay for active and passive search matches
  - annotation overlay for persisted comment anchors
- Compute search and highlight overlay rectangles at runtime from DOM `Range.getClientRects()` against the text layer
- Persist annotation rectangles only for user-created annotations
- Prefer persisted `anchorData.rects` when replaying PDF annotations; if absent or invalid, recompute from runtime text-layer offsets and page/run mapping
- Hide the raw-source dialog for PDF documents in v1

### Annotation Creation And Read Models

- Keep `resolveSelectionPoint` offset semantics unchanged
- For PDF, `blockKey` is the page block key and `offset` is the page-level visible-text offset
- On annotation creation from PDF selection:
  - keep the existing hidden fields for `startBlockKey`, `startOffset`, `endBlockKey`, and `endOffset`
  - add hidden `anchorData` JSON containing page numbers, run indices, and normalized rects
- Update `src/lib/annotations/create-annotation.ts`:
  - keep quote reconstruction from persisted blocks
  - persist `anchorData` when provided
  - validate that `anchorData.kind === "pdf-page-text-v1"` only when the document format is `PDF`
- Update shared and owner document loaders so annotations include `anchorData`

### API Routes And Access Control

- Add owner-only PDF source route: `/api/documents/[documentId]/pdf`
- Add shared-view PDF source route: `/api/shared/[token]/pdf`
- Both routes return `application/pdf` bytes from Postgres
- Both routes enforce the same authorization model as the current document pages
- `DocumentPdfPreview` receives only the route URL, not inlined PDF bytes
- Do not add public caching in v1

### Metrics, Lists, And Backfill

- Replace list-page summary, library search text, word count, and reading time derivation from `rawMarkdown` with `plainText`
- Replace storage meter derivation from `Buffer.byteLength(rawMarkdown)` with `sourceByteSize`
- Keep `rawMarkdown` usage only where Markdown source is actually needed for rendering or the raw dialog
- Add a backfill script for existing Markdown docs:
  - `sourceFormat = MARKDOWN`
  - `plainText = blocks ordered by sortOrder joined with "\n\n"`
  - `sourceByteSize = Buffer.byteLength(rawMarkdown, "utf8")`
  - `pdfData = null`

## Test Plan

- Unit: PDF upload parser builds deterministic page blocks from a born-digital fixture
- Unit: scan-detection heuristic rejects an image-only fixture and accepts a text PDF with one cover or image page
- Unit: runtime text-layer offset mapping reproduces the same page text as upload-time parsing
- Unit: `buildReaderSearchMatches` and `computeHighlightMatches` work unchanged on `pdf-page` blocks
- Unit: annotation creation persists `anchorData` for PDF and keeps Markdown behavior unchanged
- Component: `DocumentPdfPreview` renders pages, text layer, overlays, and search scrolling
- Component: PDF selection inside a text run resolves back to the expected page offsets
- Component: shared read-only PDF view shows the same highlights and annotations as the owner view
- Integration: upload form accepts `.pdf`, rejects scanned PDFs, rejects password-protected PDFs, and still accepts Markdown
- E2E: owner uploads a text PDF, sees vocabulary highlights, creates an annotation, refreshes, and sees the same overlay
- E2E: shared viewer opens the PDF link and sees the same persisted highlights and annotation overlay
- Regression: current Markdown upload, reader, and sharing tests continue to pass
