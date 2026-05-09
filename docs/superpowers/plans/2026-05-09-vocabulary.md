# Vocabulary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-owned Vocabulary module with plugin-facing creation API, lookup links, JSON import/export, and word-list-backed highlighting.

**Architecture:** Store user vocabulary separately from built-in word-list entries and join entries to existing positive word lists. Reuse service functions from the API route, server actions, and import/export logic so page and plugin behavior stay consistent.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, Vitest, Tailwind CSS.

---

## File Structure

- Modify `prisma/schema.prisma`: add `VocabularyEntry` and `VocabularyEntryWordList`.
- Create `src/lib/vocabulary/normalize-word.ts`: shared word normalization.
- Create `src/lib/vocabulary/lookup-links.ts`: deterministic external URL generation.
- Create `src/lib/vocabulary/service.ts`: create/update/import/export/query vocabulary.
- Create `src/lib/highlights/get-owner-active-terms.ts`: shared active-term assembly including private vocabulary.
- Modify `src/lib/documents/create-document-from-upload.ts`: use shared active-term assembly.
- Modify `src/lib/highlights/update-document-highlight-lists.ts`: include private vocabulary terms for selected lists.
- Modify `src/lib/word-lists/update-user-word-list-preferences.ts`: include private vocabulary terms for selected lists.
- Create `src/app/api/vocabulary/route.ts`: authenticated `POST /api/vocabulary`.
- Create `src/components/vocabulary/vocabulary-actions.tsx`: client controls for lookup dropdown and import/export buttons.
- Create `src/app/(app)/vocabulary/page.tsx`: authenticated Vocabulary UI and server actions.
- Modify `src/components/layout/owner-top-bar.tsx`: add `Vocabulary` nav tab.
- Create tests under `tests/unit/vocabulary`.
- Update existing highlight and document tests for new Prisma method expectations.

## Tasks

### Task 1: Data Model And Lookup Helpers

- [ ] Write failing tests for `normalizeVocabularyWord` and `buildVocabularyLookupLinks`.
- [ ] Add `VocabularyEntry` and `VocabularyEntryWordList` models to `prisma/schema.prisma`.
- [ ] Implement helper files.
- [ ] Run `npm run db:generate`.
- [ ] Run focused vocabulary helper tests.

### Task 2: Vocabulary Service

- [ ] Write failing tests for upsert, import merge, export shape, and list slug validation.
- [ ] Implement `src/lib/vocabulary/service.ts`.
- [ ] Verify service tests pass.

### Task 3: API Route

- [ ] Write failing tests for unauthenticated, invalid payload, and successful `POST /api/vocabulary`.
- [ ] Implement `src/app/api/vocabulary/route.ts`.
- [ ] Verify API tests pass.

### Task 4: Highlight Integration

- [ ] Write failing tests proving selected word lists include owner vocabulary terms.
- [ ] Implement shared active-term assembly and wire it into document upload, document list updates, and global preference updates.
- [ ] Verify highlight and document tests pass.

### Task 5: Vocabulary Page

- [ ] Write failing page/component tests for nav tab, lookup URLs, add/import/export controls, and list chips.
- [ ] Implement `/vocabulary` page and client action controls.
- [ ] Verify page tests pass.

### Task 6: Full Verification

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] If local database is configured, run `npm run db:push` or document that schema application was not run.

