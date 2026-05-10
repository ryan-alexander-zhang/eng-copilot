# Interaction Gap Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove or complete every current UI affordance that is dead, misleading, or unsupported by backend/routes, and execute fixes one backlog item at a time with regression validation.

**Architecture:** Treat this as a remediation backlog, not a single batch feature. Prefer removing misleading controls over inventing new backend capability. Only implement a missing interaction when there is already an implied product contract, existing route, or local backend capability that can support it with a minimal change.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, Vitest, Playwright, Tailwind CSS.

---

## Scope

This plan covers:

- Dead buttons, toggles, dropdowns, checkboxes, and faux links.
- UI that claims backend status, counts, or sessions that are not real.
- Pseudo-entry points that route to `/`, `/sign-in`, or the current page instead of a real feature.

This plan does not automatically authorize building new subsystems such as billing, help center, password reset, avatar upload, or legal pages. Until a real contract exists, the default fix is to remove the affordance or restyle it as static explanatory text.

## File Structure

- Modify `src/app/(app)/documents/page.tsx`: remove fake counts and dead library controls.
- Modify `src/components/documents/document-workspace.tsx`: remove or complete dead reader toolbar and sidebar actions.
- Modify `src/components/documents/document-reader.tsx`: remove or complete dead context-menu and footer actions.
- Modify `src/components/documents/annotation-panel.tsx`: remove or complete dead filter/action affordances.
- Modify `src/components/documents/annotation-editor-panel.tsx`: remove dead formatting toolbar or replace with passive text.
- Modify `src/app/(app)/word-lists/page.tsx`: remove fake backend/sync semantics and dead filters.
- Modify `src/components/word-lists/word-list-selection-form.tsx`: preserve only real selection behavior.
- Modify `src/app/(app)/vocabulary/page.tsx`: remove dead bulk-selection and row action affordances.
- Modify `src/app/(app)/annotations/page.tsx`: remove dead per-row and view-toggle controls.
- Modify `src/components/annotations/annotations-filter-bar.tsx`: remove dead view-toggle affordance if no view mode exists.
- Modify `src/components/annotations/shared-annotations-filter-bar.tsx`: remove dead view-toggle affordance if no view mode exists.
- Modify `src/app/(app)/settings/page.tsx`: align queried session data with exposed settings controls.
- Modify `src/components/settings/settings-page-shell.tsx`: remove or retarget unsupported account/help/security CTAs.
- Modify `src/app/sign-in/page.tsx`: remove unsupported auth-adjacent entry points.
- Modify `src/app/sign-in/credentials-sign-in-form.tsx`: remove unsupported remember-me and forgot-password affordances unless implemented.
- Modify `src/components/layout/library-nav-sidebar.tsx`: remove dead upgrade/help CTAs.
- Modify `src/components/layout/owner-documents-sidebar.tsx`: remove dead upgrade CTA.
- Modify `src/components/layout/owner-top-bar.tsx`: remove dead top-bar search affordance unless implemented.
- Modify `src/components/layout/upload-sidebar-panel.tsx`: remove drag-and-drop claim or implement actual drop handling.
- Modify `src/app/shared/[token]/page.tsx`: remove dead help button.
- Modify `src/app/shared/[token]/annotations/page.tsx`: remove dead help button.
- Modify `src/components/documents/shared-document-shell.tsx`: remove dead shared-view learn-more CTA.
- Modify `src/components/documents/shared-annotations-page-content.tsx`: remove faux learn-more affordance.
- Add or modify focused unit tests under `tests/unit/documents`, `tests/unit/annotations`, `tests/unit/word-lists`, `tests/unit/vocabulary`, `tests/unit/settings`, and `tests/unit/auth`.
- Reuse smoke coverage in `tests/e2e/owner-upload-and-share.spec.ts` and `tests/e2e/vocabulary-smoke.spec.ts` where relevant.

## Working Rules

- Fix exactly one backlog item per implementation pass.
- Every item must end with both:
  - regression verification of existing related behavior
  - at least one new or expanded validation covering the fixed affordance
- Preferred order of action for any unsupported affordance:
  1. remove it
  2. convert it to passive, non-interactive copy
  3. wire it to an existing capability
  4. only then consider building a new capability
- If an item spans both UI and backend but the backend contract does not already exist in the repo, stop at removing the misleading UI and leave the backend feature out of scope.
- After each fix, update this document:
  - mark the item complete
  - append the exact tests run
  - append any newly added test files or cases

## Per-Item Execution Protocol

For every backlog item below, use this checklist:

- [ ] Reproduce the current broken or misleading behavior locally from code or tests.
- [ ] Add or update a focused test that fails before the fix.
- [ ] Implement the minimal fix.
- [ ] Run the focused test and confirm pass.
- [ ] Run the related regression suite from the matrix below.
- [ ] Update this plan with the verification performed and any new tests added.

## Regression Matrix

- Documents library:
  - `tests/unit/documents/library-pages.test.tsx`
  - `tests/unit/documents/document-table-row-actions.test.tsx`
  - Add `tests/unit/documents/documents-page.test.tsx` if page-level assertions are needed.
- Reader and annotation workspace:
  - `tests/unit/documents/document-workspace.test.tsx`
  - `tests/unit/documents/document-reader.test.tsx`
  - `tests/unit/documents/annotation-panel.test.tsx`
  - `tests/unit/annotations/build-annotation-segments.test.ts`
- Word lists:
  - `tests/unit/word-lists/word-lists-page.test.tsx`
  - `tests/unit/word-lists/word-list-selection-form.test.tsx`
- Vocabulary:
  - `tests/unit/vocabulary/vocabulary-page.test.tsx`
  - `tests/unit/vocabulary/vocabulary-disclosure.test.tsx`
  - `tests/unit/vocabulary/service.test.ts`
  - `tests/e2e/vocabulary-smoke.spec.ts`
- Annotations index:
  - `tests/unit/annotations/annotations-page.test.tsx`
  - `tests/unit/annotations/dashboard.test.ts`
- Settings and auth:
  - `tests/unit/settings/settings-page-shell.test.tsx`
  - `tests/unit/auth/password-sign-in.test.ts`
  - Add sign-in page/form render tests if auth CTA cleanup is changed.
- Shared read-only flows:
  - `tests/unit/documents/shared-document-shell.test.tsx`
  - `tests/unit/documents/shared-annotations-page-content.test.tsx`
  - `tests/unit/documents/shared-document-page.test.tsx`
  - `tests/e2e/owner-upload-and-share.spec.ts`

## Priority Definitions

- `P0`: false data, false backend state, or a core product promise that is currently untrue.
- `P1`: dead controls inside the main document, library, vocabulary, annotation, or upload workflows.
- `P2`: dead help, upsell, read-only, or secondary navigation affordances.

## Backlog

### P0

- [x] `IG-P0-01` Real annotation counts on the Documents page.
  - Files: `src/app/(app)/documents/page.tsx`
  - Problem: `DESIGN_TOTAL_ANNOTATIONS` and `DESIGN_ANNOTATION_COUNT_BY_TITLE` override real data.
  - Preferred fix: delete design constants and render database counts only.
  - Minimum validation:
    - add page-level assertions for total annotations and row annotations
    - run `tests/unit/documents/library-pages.test.tsx`
    - run any new `documents-page` unit test added for this fix
  - Status: Completed on 2026-05-10.
  - New validation:
    - added `tests/unit/documents/documents-page.test.tsx`
    - asserts the total-annotations stat uses real document counts
    - asserts row-level annotation counts are rendered from `document._count.annotations`
  - Tests run:
    - `npm test -- tests/unit/documents/documents-page.test.tsx`
    - `npm test -- tests/unit/documents/library-pages.test.tsx`

- [ ] `IG-P0-02` Fake backend health and sync semantics on `/word-lists`.
  - Files: `src/app/(app)/word-lists/page.tsx`
  - Problem: the page claims backend health, "Just now" sync state, and exposes sync-style controls without a real sync source or health contract.
  - Preferred fix: remove or downgrade the health/sync UI to non-misleading static copy until real telemetry exists.
  - Minimum validation:
    - update `tests/unit/word-lists/word-lists-page.test.tsx`
    - run `tests/unit/word-lists/word-list-selection-form.test.tsx`

- [ ] `IG-P0-03` Fake "View all sessions" capability in Settings.
  - Files: `src/app/(app)/settings/page.tsx`, `src/components/settings/settings-page-shell.tsx`
  - Problem: the UI offers "View all sessions" while the query hard-caps sessions to `take: 3`.
  - Preferred fix: remove the link until a non-truncated session view exists, or implement a real full-session page before re-exposing it.
  - Minimum validation:
    - update `tests/unit/settings/settings-page-shell.test.tsx`
    - add page-level assertion if the query shape changes

- [ ] `IG-P0-04` Unsupported auth-adjacent entry points on the sign-in surface.
  - Files: `src/app/sign-in/page.tsx`, `src/app/sign-in/credentials-sign-in-form.tsx`
  - Problem: `Remember me` is not read by the server action; `Forgot password?` loops back to `/sign-in`; `Create account`, `Pricing`, `Terms of Service`, and `Privacy Policy` point to `/`.
  - Preferred fix: remove unsupported controls and links until corresponding routes and contracts exist.
  - Minimum validation:
    - add or update sign-in render tests
    - run `tests/unit/auth/password-sign-in.test.ts`

### P1

- [ ] `IG-P1-01` Dead `Filter` button on `/documents`.
  - Files: `src/app/(app)/documents/page.tsx`
  - Preferred fix: remove the button unless a real filter model is added in the same pass.
  - Minimum validation: page-level render test plus documents library regression tests.

- [ ] `IG-P1-02` Non-submitting sort control on `/documents`.
  - Files: `src/app/(app)/documents/page.tsx`
  - Preferred fix: either wire the select to submit on change or replace it with a real submit button.
  - Minimum validation: page-level sort interaction test plus documents library regression tests.

- [ ] `IG-P1-03` Dead row-selection affordances on `/documents`.
  - Files: `src/app/(app)/documents/page.tsx`
  - Preferred fix: remove table checkboxes until a real bulk-action model exists.
  - Minimum validation: page-level render test proving selections are absent or intentionally non-interactive.

- [ ] `IG-P1-04` Dead reader toolbar controls in document workspace.
  - Files: `src/components/documents/document-workspace.tsx`
  - Problem: `Reading`, document search, view toggle, and toolbar more-actions button do nothing.
  - Preferred fix: remove unsupported controls from the toolbar in one pass.
  - Minimum validation:
    - update `tests/unit/documents/document-workspace.test.tsx`
    - run `tests/unit/documents/document-reader.test.tsx`

- [ ] `IG-P1-05` Dead secondary actions in document workspace.
  - Files: `src/components/documents/document-workspace.tsx`, `src/components/documents/document-reader.tsx`
  - Problem: `Dismiss`, `View all matched words`, and `Open raw Markdown` have no backing behavior.
  - Preferred fix: remove them or convert them to passive text until real routes/actions exist.
  - Minimum validation:
    - update `tests/unit/documents/document-workspace.test.tsx`
    - update `tests/unit/documents/document-reader.test.tsx`

- [ ] `IG-P1-06` Dead context-menu actions in document reader.
  - Files: `src/components/documents/document-reader.tsx`
  - Problem: `Copy`, `Search the web`, and `Inspect` are rendered as live buttons but have no handlers.
  - Preferred fix: remove dead entries and leave only `Add annotation`, or implement copy if kept.
  - Minimum validation:
    - update `tests/unit/documents/document-reader.test.tsx`
    - run `tests/unit/annotations/build-annotation-segments.test.ts`

- [ ] `IG-P1-07` Dead filter/action affordances in the annotation side panel.
  - Files: `src/components/documents/annotation-panel.tsx`
  - Problem: the detailed-mode dropdown, filter button, and default `View all annotations` button are dead when no `viewAllHref` exists.
  - Preferred fix: remove dead controls from contexts that do not support them.
  - Minimum validation:
    - update `tests/unit/documents/annotation-panel.test.tsx`

- [ ] `IG-P1-08` Dead formatting toolbar in annotation editor.
  - Files: `src/components/documents/annotation-editor-panel.tsx`
  - Preferred fix: remove formatting buttons until rich-text editing exists.
  - Minimum validation:
    - add/update annotation editor render coverage under document workspace tests

- [ ] `IG-P1-09` Dead source filter and misleading refresh action on `/word-lists`.
  - Files: `src/app/(app)/word-lists/page.tsx`
  - Problem: `All Sources` is not part of the query model and `Refresh` submits the selection form rather than refreshing backend data.
  - Preferred fix: remove the source filter and rename/remove refresh semantics.
  - Minimum validation:
    - update `tests/unit/word-lists/word-lists-page.test.tsx`

- [ ] `IG-P1-10` Dead bulk-selection affordances on `/vocabulary`.
  - Files: `src/app/(app)/vocabulary/page.tsx`
  - Preferred fix: remove table selection checkboxes until bulk actions exist.
  - Minimum validation:
    - update `tests/unit/vocabulary/vocabulary-page.test.tsx`

- [ ] `IG-P1-11` Dead row `More actions` affordance on `/vocabulary`.
  - Files: `src/app/(app)/vocabulary/page.tsx`
  - Preferred fix: remove the ellipsis button until extra actions exist.
  - Minimum validation:
    - update `tests/unit/vocabulary/vocabulary-page.test.tsx`
    - run `tests/unit/vocabulary/vocabulary-disclosure.test.tsx`

- [ ] `IG-P1-12` Dead view-toggle and per-row more-actions affordances on `/annotations`.
  - Files: `src/components/annotations/annotations-filter-bar.tsx`, `src/app/(app)/annotations/page.tsx`
  - Preferred fix: remove the dead view-toggle button and row ellipsis control.
  - Minimum validation:
    - update `tests/unit/annotations/annotations-page.test.tsx`
    - run `tests/unit/annotations/dashboard.test.ts`

- [ ] `IG-P1-13` Dead view-toggle affordance on shared annotations page.
  - Files: `src/components/annotations/shared-annotations-filter-bar.tsx`
  - Preferred fix: remove the dead button until an alternate shared-annotations view exists.
  - Minimum validation:
    - update `tests/unit/documents/shared-annotations-filter-bar.test.tsx`
    - run `tests/unit/documents/shared-annotations-page-content.test.tsx`

- [ ] `IG-P1-14` Dead help buttons in shared page headers.
  - Files: `src/app/shared/[token]/page.tsx`, `src/app/shared/[token]/annotations/page.tsx`
  - Preferred fix: remove the buttons until a real shared-view help surface exists.
  - Minimum validation:
    - update `tests/unit/documents/shared-document-page.test.tsx`
    - run `tests/unit/documents/shared-annotations-page-content.test.tsx`

- [ ] `IG-P1-15` False drag-and-drop affordance in upload sidebar.
  - Files: `src/components/layout/upload-sidebar-panel.tsx`
  - Problem: UI says "Drop .md files here" but no drop handling exists.
  - Preferred fix: change copy to click-only upload, unless real drop handlers are implemented in the same pass.
  - Minimum validation:
    - add upload sidebar render assertions through document/workspace or library tests
    - run `tests/e2e/owner-upload-and-share.spec.ts` if upload behavior changes

### P2

- [ ] `IG-P2-01` Dead top-bar search affordance.
  - Files: `src/components/layout/owner-top-bar.tsx`
  - Preferred fix: remove the search button until a real global search flow exists.
  - Minimum validation: update any top-bar render coverage touched by page tests.

- [ ] `IG-P2-02` Dead upgrade/help CTAs in library sidebars.
  - Files: `src/components/layout/library-nav-sidebar.tsx`, `src/components/layout/owner-documents-sidebar.tsx`
  - Problem: `Upgrade plan` and `See how it works` are exposed as buttons with no routes or actions.
  - Preferred fix: remove them until real destinations exist.
  - Minimum validation:
    - update `tests/unit/documents/library-pages.test.tsx`

- [ ] `IG-P2-03` Dead help and learn-more links in Settings.
  - Files: `src/components/settings/settings-page-shell.tsx`
  - Problem: `Open help center`, `Learn more`, and `Learn more about data deletion` point to `/`.
  - Preferred fix: remove them until real destinations exist.
  - Minimum validation:
    - update `tests/unit/settings/settings-page-shell.test.tsx`

- [ ] `IG-P2-04` Dead shared-view learn-more CTA.
  - Files: `src/components/documents/shared-document-shell.tsx`
  - Preferred fix: remove the button until a real destination exists.
  - Minimum validation:
    - update `tests/unit/documents/shared-document-shell.test.tsx`

- [ ] `IG-P2-05` Faux learn-more affordance on shared annotations page.
  - Files: `src/components/documents/shared-annotations-page-content.tsx`
  - Problem: "Learn more →" is styled as an affordance but is only text.
  - Preferred fix: remove it or restyle it as passive copy.
  - Minimum validation:
    - update `tests/unit/documents/shared-annotations-page-content.test.tsx`

## Recommended Execution Order

1. `IG-P0-01`
2. `IG-P0-02`
3. `IG-P0-03`
4. `IG-P0-04`
5. `IG-P1-01` through `IG-P1-05`
6. `IG-P1-06` through `IG-P1-10`
7. `IG-P1-11` through `IG-P1-15`
8. `IG-P2-01` through `IG-P2-05`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-10-interaction-gap-remediation-plan.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh worker per backlog item and review between items.
2. Inline Execution - execute backlog items in this session one by one, updating this file after each verified fix.
