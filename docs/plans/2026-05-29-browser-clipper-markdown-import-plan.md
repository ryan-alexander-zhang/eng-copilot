# Browser Clipper Markdown Import Plan

## Summary

- v1 shape: Chrome MV3 extension only. No in-app URL paste import.
- Extraction path: run `defuddle/full` in the current page DOM, convert the main article to Markdown, then upload to eng-copilot through a dedicated clip API.
- Storage path: clipped pages are persisted as normal Markdown documents, so the existing Markdown projection, highlights, annotations, and sharing flows stay unchanged.
- Scope limits:
  - Chrome MV3 only
  - full article only
  - preserve source URL
  - preserve remote image links
  - single active clipper token per user

## Data Model

- `Document.sourceUrl String?`
- `User.clipperTokenHash String?`
- `User.clipperTokenPreview String?`
- `User.clipperTokenCreatedAt DateTime?`
- `User.clipperTokenLastUsedAt DateTime?`

## Backend

- Add `POST /api/documents/clip`
- Authenticate with `Authorization: Bearer <clipperToken>`
- Validate:
  - JSON body only
  - `url` must be `http` or `https`
  - markdown must be non-empty
  - markdown payload must be `<= 10 MB`
- Reuse a shared Markdown persistence helper so file-uploaded Markdown and clipped Markdown follow the same projection and highlight pipeline.

## Settings UI

- Extend the existing Security tab with a `Web Clipper` section.
- Provide:
  - configured/not-configured state
  - masked token preview
  - generate/rotate token action
  - one-time plaintext token display after generation

## Document UI

- When `sourceUrl` exists, show `Open original` in the owner document toolbar.

## Extension

- New directory: `extensions/eng-copilot-clipper/`
- Build with `esbuild`
- Files:
  - `manifest.json`
  - `src/popup.ts`
  - `src/options.ts`
  - `src/content-script.ts`
  - `src/shared.ts`
  - `static/popup.html`
  - `static/options.html`
- Popup flow:
  1. read settings from `chrome.storage.sync`
  2. send a clip request to the content script
  3. content script runs `defuddle/full`
  4. popup uploads `{ url, title, markdown }` to `/api/documents/clip`
  5. on success, open the new eng-copilot document tab

## Verification

- Unit coverage for:
  - shared Markdown persistence helper
  - clip API validation/auth
  - clipper token hashing/rotation helpers
  - settings security rendering
  - extension shared helpers
- Manual QA for:
  - loading the unpacked Chrome extension
  - configuring base URL and token
  - clipping a regular article page
  - rejecting unsupported pages such as `chrome://`, `file://`, and PDF viewer pages
