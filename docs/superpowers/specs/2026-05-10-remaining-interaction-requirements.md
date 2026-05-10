# Remaining Interaction Capability Requirements

**Source:** Reviewed from [Interaction Gap Remediation Implementation Plan](../plans/2026-05-10-interaction-gap-remediation-plan.md).

**Decision:** Keep the completed truthfulness fixes. Treat every remaining unchecked interaction item as a feature backlog, not as a removal backlog. The default action for the remaining items is to implement the underlying capability if it supports the product promise and can be delivered incrementally.

**Why this document exists:** The original remediation plan was correct for false data, fake backend state, and misleading auth/settings entry points. It is too removal-oriented for the remaining workspace features. The remaining backlog should now be prioritized by user value in the core workflow: upload -> read -> annotate -> review vocabulary -> share.

---

## Review Outcome

- The removal-first strategy should remain limited to false promises, fake data, and unsupported security/account flows.
- The remaining controls are not equal in value. Several are part of the actual product promise and should be completed, not removed.
- Some current control labels are placeholders rather than fully-formed requirements. These should be rewritten as user-valued capabilities before implementation.

Examples:

- `Reading` + the reader/list toggle should become a real workspace mode or reading-preferences feature, not stay as generic controls.
- `Inspect` is too vague to implement literally. It should become a concrete detail action or be folded into another flow.
- `Upgrade plan` and `Learn more` should not be implemented as empty links; they need real destinations and content ownership.

---

## Prioritization Rubric

- `Critical`: directly affects the primary reading and annotation workflow.
- `High`: significantly improves upload, vocabulary management, or annotation review efficiency.
- `Medium`: improves navigation, discoverability, or shared-view understanding.
- `Low`: support, education, or monetization surfaces that do not block the core workflow.

---

## Requirement Backlog

### REQ-01 Core Document Workspace Completion

**Priority:** Critical

**Maps from:** `IG-P1-04`, `IG-P1-05`, `IG-P1-06`, `IG-P1-07`

**User value:** A reader should be able to search, inspect, copy, annotate, and navigate document-level metadata without leaving the main workspace.

**MVP requirements:**

- The `Search in document...` field must perform real in-document search across rendered blocks.
- Search results must visibly highlight matches and support moving between results.
- The selection menu `Copy` action must copy the selected text.
- The selection menu `Search the web` action must open a new browser tab for the selected phrase.
- `View all annotations` from the workspace must deep-link to the owner annotations index filtered to the current document.
- `View all matched words` must open a document-scoped matched-words drill-down view.
- `Open raw Markdown` must open the source content in a modal, drawer, or dedicated route.
- `Dismiss` on the workspace tip must hide the tip for the current browser session.

**Controls that need clearer product definition before build:**

- `Reading` should become either:
  - reading preferences, or
  - a real workspace mode selector.
- The reader/list icon toggle should become either:
  - reader vs outline view, or
  - reader vs annotation list view.
- The top-right `More` button should become a real secondary-actions menu.
- `Inspect` should be renamed to a concrete action before implementation.

**Acceptance criteria:**

- A user can search for a phrase that exists in the document and move through all hits.
- A selected phrase can be copied without leaving the page.
- A selected phrase can be sent to external web search.
- The workspace provides a navigable path to full annotations and full matched-word results.
- None of the above actions are rendered as dead buttons.

### REQ-02 Annotation Editor Formatting

**Priority:** Medium

**Maps from:** `IG-P1-08`

**User value:** Users taking study notes need lightweight formatting support, but the feature should fit the current string-based note model.

**Recommended scope:** Implement a markdown-assisted editor before considering a full rich-text editor.

**MVP requirements:**

- Toolbar buttons must insert real formatting into the note textarea.
- Supported first-phase formatting:
  - bold
  - italic
  - bulleted list
  - numbered list
  - link
- If table support is kept, it must insert markdown table scaffolding; otherwise it should wait for a later phase.

**Acceptance criteria:**

- Selecting note text and clicking a formatting control changes the textarea value.
- Saving the annotation persists the formatted content exactly as edited.
- Toolbar controls are never rendered as visual-only buttons.

### REQ-03 Drag-and-Drop Upload

**Priority:** High

**Maps from:** `IG-P1-15`

**User value:** Upload is an entry-point action. Drag-and-drop should work if the UI invites users to use it.

**MVP requirements:**

- The sidebar dropzone must accept markdown files via drag-and-drop.
- Supported file types must match the current file input contract.
- Dropping a valid file must submit through the existing upload action.
- Drag-over and drop states must provide visible feedback.
- Invalid file types and upload failures must use the same error path as click-upload.

**Acceptance criteria:**

- A valid dropped markdown file uploads without requiring an extra click.
- Invalid drops show a user-visible error.
- The dropzone copy matches the actual behavior.

### REQ-04 Vocabulary Batch Management

**Priority:** High

**Maps from:** `IG-P1-10`, `IG-P1-11`

**User value:** Users managing saved vocabulary need to act on many entries at once, not one row at a time.

**MVP requirements:**

- Table row selection and header selection must work.
- A bulk-action bar must appear when one or more rows are selected.
- First-phase bulk actions:
  - add selected entries to one or more word lists
  - remove selected entries from one or more word lists
  - delete selected entries
  - export selected entries
- The row `More actions` button must expose lower-frequency actions that do not justify permanent inline buttons.

**Acceptance criteria:**

- Selecting entries changes visible selection state.
- Bulk actions operate only on the selected rows.
- The row `More actions` menu performs at least one action not otherwise available inline.

### REQ-05 Annotation Index Modes and Actions

**Priority:** High

**Maps from:** `IG-P1-12`, `IG-P1-13`

**User value:** Users reviewing many annotations need more than one browsing mode, and owner views need row-level actions.

**MVP requirements:**

- The owner annotations page must support two useful views:
  - dense table view
  - grouped or card-based review view
- The shared annotations page must support the same view switch in read-only mode.
- The owner row `More actions` control must open a real action menu.
- First-phase owner row actions should include:
  - open annotation in source document
  - copy quote or reference
  - delete annotation, if permissions already allow it

**Acceptance criteria:**

- Toggling the view mode changes the rendered layout and persists in the URL or local state.
- Owner row actions perform real operations.
- Shared view remains read-only even when alternate presentation modes are added.

### REQ-06 Global Workspace Search

**Priority:** Medium

**Maps from:** `IG-P2-01`

**User value:** A top-level search affordance should help users jump to documents, annotations, and vocabulary instead of acting as a decorative icon.

**MVP requirements:**

- The top-bar search control must open a real quick-search surface.
- First-phase results may be limited to:
  - document title
  - original filename
  - annotation quote
  - vocabulary word
- Selecting a result must navigate directly to the relevant page or anchored view.

**Acceptance criteria:**

- The top-bar search opens a searchable UI.
- Typing a known term returns matching results.
- Choosing a result takes the user to the correct destination.

### REQ-07 Shared View Guidance

**Priority:** Medium

**Maps from:** `IG-P1-14`, `IG-P2-04`, `IG-P2-05`

**User value:** Shared viewers need clear help for permissions, read-only behavior, and next steps.

**MVP requirements:**

- The shared document help buttons and learn-more affordances must open a real shared-view help surface.
- The shared annotations page learn-more affordance must point to the same help surface.
- The help content must explain:
  - what read-only means
  - whether authentication is required
  - how annotations and word highlights are shown
  - how to return to the full product

**Acceptance criteria:**

- Every shared-view help affordance leads to real content.
- The shared help destination is consistent across shared document and shared annotations pages.

### REQ-08 Sidebar and Settings Help/Plan Surfaces

**Priority:** Low

**Maps from:** `IG-P2-02`, `IG-P2-03`

**User value:** Informational and monetization surfaces should support user education and conversion, but they do not block the main workflow.

**MVP requirements:**

- `Upgrade plan` must route to a real pricing or billing destination.
- `See how it works` must route to a real product-tour or help destination.
- Settings help links must route to real documentation content, not `/`.
- The data-deletion learn-more destination must specifically explain deletion scope and permanence.

**Acceptance criteria:**

- No sidebar or settings CTA routes to `/` as a placeholder.
- Each CTA has a destination with content that matches the label.

---

## Suggested Delivery Order

1. `REQ-01` Core Document Workspace Completion
2. `REQ-03` Drag-and-Drop Upload
3. `REQ-04` Vocabulary Batch Management
4. `REQ-05` Annotation Index Modes and Actions
5. `REQ-02` Annotation Editor Formatting
6. `REQ-06` Global Workspace Search
7. `REQ-07` Shared View Guidance
8. `REQ-08` Sidebar and Settings Help/Plan Surfaces

---

## Execution Rule For Future Fixes

- Use this document to decide what should be built.
- Use the remediation plan to track what has already been fixed and how it was validated.
- For any remaining unchecked item, prefer adding capability over removing UI if the requirement above covers it.
- Only fall back to removal when a control still communicates a false promise and no near-term implementation path is accepted.
