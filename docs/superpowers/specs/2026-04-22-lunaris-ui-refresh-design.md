# Lunaris UI Refresh Design

## Status

Approved for implementation planning.

## Date

2026-04-22

## Summary

This design replaces the current minimal HTML-first interface with a Lunaris-inspired frontend based on the `ui.pen` reference and the official Lunaris UI usage model.

The refresh covers all current user-facing pages:

- public landing page at `/`
- sign-in page at `/sign-in`
- authenticated documents list at `/documents`
- upload page at `/documents/new`
- owner document workspace at `/documents/[documentId]`
- shared read-only reader at `/shared/[token]`

The new design also changes annotation creation from a manual range form to a preview-driven interaction:

1. the owner selects text in the rendered preview
2. the owner right-clicks the valid selection
3. a lightweight context menu shows `Create annotation`
4. selecting that action opens a dialog to confirm the quote and add a note

## Goals

- Rebuild the frontend to match the structure and visual hierarchy described in `ui.pen`
- Use the Lunaris UI delivery model: install Tailwind CSS and Framer Motion, then adapt copied component snippets in-repo
- Preserve all existing product capabilities and access constraints
- Replace the annotation range-entry form with a preview-based right-click workflow
- Visually distinguish vocabulary highlights from persistent annotations
- Update `ARCHITECTURE.md` so the documented system shape matches the shipped UI and interaction model

## Non-Goals

- Upgrading the core application stack such as `next`, `react`, `next-auth`, or `prisma`
- Introducing a new backend annotation model
- Adding new product features beyond the approved UI rewrite and annotation interaction change
- Turning the shared reader into an editable workspace
- Adding collaborative annotations, custom word lists, or Markdown source editing

## Constraints And Assumptions

- `ui.pen` is the primary visual and structural reference
- Lunaris UI is not consumed as an npm component package; it is used through copied Tailwind and Motion-based snippets adapted locally
- The current server-side annotation contract remains unchanged:
  - `startBlockKey`
  - `startOffset`
  - `endBlockKey`
  - `endOffset`
  - `note`
- Shared readers remain authenticated and read-only
- The existing document model, highlight persistence, and annotation persistence remain intact

## Verified Dependency Decisions

Only the frontend styling and motion dependencies are updated in this work.

Checked on 2026-04-22:

- `tailwindcss`: `4.2.4`
- `framer-motion`: `12.38.0`

Additional required support packages:

- `@tailwindcss/postcss 4.2.4`
- `postcss 8.5.10`

The current core stack is intentionally unchanged.

## Frontend Architecture

The refreshed frontend is split into four presentation zones.

### 1. Public Marketing

Owned routes:

- `/`

Responsibilities:

- present the product narrative from `ui.pen`
- provide sign-in and workspace entry calls to action
- communicate the product capabilities without requiring authentication

Implementation notes:

- use Lunaris-style hero, CTA, and feature sections
- replace the current redirect from `/` to `/documents`

### 2. Authenticated App Shell

Owned routes:

- `/documents`
- `/documents/new`
- `/documents/[documentId]`

Responsibilities:

- provide the authenticated page frame
- unify spacing, typography, buttons, cards, and forms
- keep document-management pages visually consistent

Implementation notes:

- establish shared Tailwind utility patterns and small local UI primitives
- keep routing and server actions aligned with current behavior

### 3. Owner Document Workspace

Owned route:

- `/documents/[documentId]`

Responsibilities:

- present document metadata
- manage share state
- manage built-in highlight list toggles
- render the Markdown preview
- create, update, and delete annotations

Required workspace sections:

- top metadata section
- share card
- highlight-list card
- preview card
- annotation list card

### 4. Shared Read-Only Reader

Owned route:

- `/shared/[token]`

Responsibilities:

- render the same persisted document, highlights, and annotations
- reuse the owner preview visual language where possible
- remove all mutation controls

## Page-Level Design

### Landing Page

The root route becomes a public landing page rather than an automatic redirect.

The page includes:

- top navigation
- hero content
- feature chips and sections
- action buttons leading to sign-in or the workspace

The page should match `ui.pen` closely in layout and tone while remaining responsive.

### Sign-In Page

The sign-in page adopts the Lunaris visual system while preserving the existing Google sign-in flow and callback behavior.

The page includes:

- clear product framing
- a single primary Google sign-in action
- a secondary path back to the public landing page

### Documents List

The documents index becomes a styled workspace screen rather than a plain heading and list.

The page includes:

- page title and supporting copy
- primary upload action
- styled document cards or rows
- uploaded timestamp and file metadata

### Upload Page

The upload route becomes a guided upload screen with:

- a styled file input area
- upload rules and size guidance
- inline validation messaging
- a clear return path to the document list

### Owner Document Workspace

The owner detail route becomes the primary working surface.

It includes:

- document title and metadata
- share card
- highlight-list toggle card
- preview card
- annotations card

The page is the main place where the annotation interaction changes.

### Shared Reader

The shared route mirrors the owner preview presentation but removes:

- share controls
- highlight-list controls
- annotation creation
- annotation editing
- annotation deletion

## Component Boundaries

The refresh introduces a clearer split between page shells and document-specific components.

### Shared UI Primitives

Local primitives adapted from Lunaris patterns:

- buttons
- section/card wrappers
- text inputs and textareas
- status chips
- simple animated wrappers

### Marketing Components

- landing navigation
- hero section
- feature section
- CTA section

### Workspace Components

- `DocumentPreview`
- `SelectionContextMenu`
- `CreateAnnotationDialog`
- `AnnotationList`
- `HighlightListCard`
- `ShareCard`
- `DocumentList`
- `UploadForm`

`DocumentPreview` is the central rendering surface for both owner and shared routes, with owner-only behavior enabled via props.

## Annotation Interaction Design

### Previous Flow

The current UI asks the owner to manually define block keys and offsets in a form. That flow is removed from creation because it conflicts with the new preview-first interaction model.

### New Creation Flow

For the owner workspace only:

1. the user selects text inside the preview
2. a right-click on a valid selection opens a lightweight context menu
3. the context menu exposes one action: `Create annotation`
4. that action opens a modal or dialog
5. the dialog shows the selected quote and a note field
6. submission posts the existing anchor fields plus the note through the current server action contract

### Selection Rules

- Only valid selections inside rendered document text are eligible
- Empty selections do nothing
- Invalid or unmappable ranges do nothing
- Cross-block selection is allowed if the DOM selection can be translated into the existing block key and offset format
- Shared readers never see the context menu or creation dialog

### Update And Delete Flow

Annotation editing remains in the annotation list panel.

Owners can:

- edit note text
- delete existing annotations

The design intentionally keeps update and delete outside the right-click context menu to avoid unnecessary interaction complexity.

## Highlight And Annotation Rendering Rules

The preview must visually separate two concepts:

- vocabulary highlight matches
- persistent annotations

### Highlight Styling

- warm yellow palette
- indicates a persisted word-list match

### Annotation Styling

- blue-cyan or blue-green palette distinct from the word highlight color
- indicates a user-created annotation
- replaces the previous underline-only treatment

### Overlap Rule

When the same text range is both highlighted and annotated:

- annotation styling wins visually
- metadata for both states remains available on the rendered element for testing and future interaction hooks

This makes annotation state unambiguous while preserving machine-readable state.

## Rendering And Mapping Strategy

The existing block-based rendering model remains the anchor system of record.

The preview renderer must:

- preserve per-block identity in the DOM
- preserve enough offset information to map a browser selection back to block keys and text offsets
- continue rendering slices so overlapping highlight and annotation ranges are deterministic

The implementation may refactor the current reader component into a more interactive preview component, but it must not change persisted backend contracts.

## Styling And Motion Strategy

### Styling

- add `src/app/globals.css`
- add Tailwind CSS v4 through the Next.js-supported PostCSS flow
- define shared color, spacing, and typography tokens in CSS where needed
- keep the site responsive for desktop and mobile

### Motion

- use `framer-motion` for selective, high-signal transitions such as section entry, cards, and dialogs
- avoid unnecessary motion in the reading workflow
- prioritize readability and interaction clarity over decorative animation

## Testing Strategy

Implementation must verify behavior, not just markup.

### Unit Tests

- preview rendering when highlights and annotations overlap
- selection parsing and right-click menu activation for valid ranges
- dialog open and close behavior
- annotation list update and delete behaviors

### Page-Level Or Component Rendering Tests

- public landing page renders the new public entry experience
- authenticated document pages render the new workspace sections
- shared reader does not expose owner-only controls

### Build Verification

- dependency installation succeeds
- lint passes if the current repo state allows it
- targeted tests for changed components pass

## Documentation Updates

`ARCHITECTURE.md` must be updated during implementation to reflect:

- the new public landing route
- the Lunaris snippet-based frontend approach
- Tailwind CSS and Framer Motion in the stack
- the split between public marketing, authenticated app shell, owner workspace, and shared reader
- the preview-based annotation creation flow
- the distinct visual semantics for highlight matches and annotations

## Success Criteria

The implementation is successful when all of the following are true:

1. the application builds with the new Tailwind and Motion dependencies
2. all current user-facing pages are rewritten to match the `ui.pen` structure and Lunaris style direction
3. the owner can create an annotation from the preview by selecting text, right-clicking, and confirming in a dialog
4. annotations and vocabulary highlights are visually distinguishable in the preview
5. shared readers can view content, highlights, and annotations but cannot mutate them
6. `ARCHITECTURE.md` matches the shipped system behavior
