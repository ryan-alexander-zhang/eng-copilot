# Lunaris UI Refresh Implementation Plan

**Goal:** Rebuild all user-facing pages to match `ui.pen`, adopt the Lunaris snippet-based Tailwind and Motion frontend approach, replace manual annotation range entry with preview right-click creation, visually separate annotations from word highlights, and update `ARCHITECTURE.md` to match the shipped system.

**Architecture:** Keep the current Next.js App Router modular monolith and existing server-side document and annotation contracts. Add Tailwind CSS v4 and Framer Motion for frontend presentation. Split the UI into a public landing layer, authenticated app shell, owner document workspace, and shared read-only reader.

**Tech Stack Changes:** Add `tailwindcss 4.2.4`, `@tailwindcss/postcss 4.2.4`, `postcss 8.5.10`, and `framer-motion 12.38.0`. Do not upgrade `next`, `react`, `next-auth`, or `prisma`.

## Task 1: Add Styling Tooling And Global UI Foundation

**Files:**
- Update: `package.json`
- Update: `package-lock.json`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`
- Update: `src/app/layout.tsx`

- [ ] Install Tailwind CSS v4, `@tailwindcss/postcss`, `postcss`, and `framer-motion`
- [ ] Add the global CSS import to the root layout
- [ ] Add shared design tokens, base typography, and utility classes aligned with the new Lunaris-inspired direction
- [ ] Verify: `npm run build`

## Task 2: Rebuild Public And Auth Entry Pages

**Files:**
- Update: `src/app/page.tsx`
- Update: `src/app/sign-in/page.tsx`
- Update: `src/app/sign-in/sign-in-button.tsx`
- Update: `tests/unit/app-shell.test.tsx`

- [ ] Replace the `/` redirect with a public landing page matching `ui.pen`
- [ ] Restyle the sign-in page and preserve existing Google sign-in behavior
- [ ] Use Motion only where it improves hierarchy or action clarity
- [ ] Verify: `npm run test -- tests/unit/app-shell.test.tsx`

## Task 3: Rebuild The Authenticated Workspace Shell, List, And Upload Screens

**Files:**
- Update: `src/app/(app)/layout.tsx`
- Update: `src/app/(app)/documents/page.tsx`
- Update: `src/app/(app)/documents/new/page.tsx`
- Update: `src/components/documents/document-list.tsx`
- Update: `src/components/documents/upload-form.tsx`
- Update: `tests/unit/documents/document-list.test.tsx`

- [ ] Add the authenticated shell frame without changing auth guard behavior
- [ ] Restyle the documents list and upload flow to match the approved design direction
- [ ] Keep existing upload action and error handling intact
- [ ] Verify: `npm run test -- tests/unit/documents/document-list.test.tsx`

## Task 4: Rebuild The Owner Document Workspace And Preview Interaction

**Files:**
- Update: `src/app/(app)/documents/[documentId]/page.tsx`
- Update: `src/components/documents/document-reader.tsx`
- Update: `src/components/documents/annotation-panel.tsx`
- Update: `src/components/documents/list-toggle-form.tsx`
- Update: `src/components/documents/share-panel.tsx`
- Update: `tests/unit/documents/document-reader.test.tsx`
- Update: `tests/unit/documents/annotation-panel.test.tsx`

- [ ] Replace the manual annotation create form with preview-based right-click creation
- [ ] Add a lightweight context menu with only `Create annotation`
- [ ] Add a dialog that submits the existing annotation anchor contract plus note
- [ ] Change annotation rendering to a distinct color treatment from word highlights
- [ ] Keep annotation update and delete in the side panel
- [ ] Verify: `npm run test -- tests/unit/documents/document-reader.test.tsx tests/unit/documents/annotation-panel.test.tsx`

## Task 5: Rebuild Shared Reader As Read-Only

**Files:**
- Update: `src/app/shared/[token]/page.tsx`

- [ ] Reuse the new preview presentation in the shared route
- [ ] Remove all owner-only mutation controls from the shared route
- [ ] Verify through rendering tests or targeted page checks that owner-only controls are absent

## Task 6: Update Architecture And Run Final Verification

**Files:**
- Update: `ARCHITECTURE.md`

- [ ] Update the documented route model, frontend layering, dependency versions, and annotation workflow
- [ ] Reconcile the design doc dependency version references with the actual latest stable versions used in code
- [ ] Run the narrowest meaningful verification set for changed files
- [ ] Verify: `npm run test` and `npm run build`
