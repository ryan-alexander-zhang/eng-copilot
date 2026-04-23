# Workflow Screens Redesign Design

## Status

Approved for implementation planning.

## Date

2026-04-23

## Summary

This design replaces the current `Workflow Screens` content in `ui.pen` with a new five-screen set that matches the user-provided reference images as closely as possible.

The homepage frame `Eng Copilot Landing` is explicitly out of scope and must remain unchanged.

The redesign is intentionally screenshot-first rather than system-first. Visual fidelity to the provided images takes priority over reuse of the current screen structure, component composition, or shared design-system patterns.

## Goals

- Rebuild `Workflow Screens` in `ui.pen` to visually match the five supplied reference images
- Preserve `Eng Copilot Landing` exactly as it is today
- Replace the existing workflow mockups rather than keeping them alongside the new work
- Restore screenshot-level fidelity for layout, spacing, labels, panels, tables, and content
- Keep the output suitable as a high-fidelity product design artifact

## Non-Goals

- Editing or restyling `Eng Copilot Landing`
- Preserving the current `Workflow Screens` layouts, composition, or styling
- Refactoring the design system for reuse
- Adding pages, states, or interactions that are not present in the five reference images
- Reconstructing unrelated small screens that appear only in source collages and are not part of the approved five targets

## Constraints And Assumptions

- The five reference images are the single source of truth for the redesign
- `Workflow Screens` can be rebuilt from scratch inside `ui.pen`
- Matching the screenshot look is more important than preserving reusable component structure
- Where the current design system conflicts with the references, the references win
- Text content should be restored as closely to the screenshots as practical, including filenames, labels, comments, and list content
- The resulting screens may use mostly static frame, text, and shape composition if that is the most reliable path to fidelity

## Scope

The redesign covers exactly these five screens:

1. `Reader`
2. `Reader - Comments Open`
3. `Documents`
4. `Shared Reader`
5. `Word Lists`

These screens replace the old workflow screens inside the existing `Workflow Screens` frame.

## Screen Organization

`Workflow Screens` remains the container frame for the non-landing UI mockups, but its existing child screens are replaced with a new horizontal sequence of five rebuilt artboards.

Each screen should:

- use a descriptive frame name matching its target state
- be laid out side by side for easy review
- contain its full static UI composition inside the frame
- visually read as a finished product mockup rather than a wireframe or component demo

## Page-Level Design

### 1. Reader

This screen recreates the default document-reading workspace.

Required visual regions:

- app-level top navigation
- left column for upload and document list/navigation
- central reading area showing the main document content
- top utility row for title, search, and document actions

The page should match the reference in density and hierarchy, including card boundaries, muted background layers, and document-preview emphasis.

### 2. Reader - Comments Open

This screen mirrors the reader layout but adds the expanded comment workflow.

Required visual regions:

- all Reader regions
- right-side comment panel
- visible annotation thread or comment history
- active input/control area for adding or replying to notes
- highlighted or contextual reading state showing the relationship between the document and the open comment area

The right panel should feel intentionally attached to the reader rather than appended as a generic sidebar.

### 3. Documents

This screen recreates the document index/listing view.

Required visual regions:

- app-level top navigation
- page title and supporting context
- tabs, filters, or segmented controls shown in the reference
- search and primary upload action
- tabular or row-based document list matching the screenshot structure

The table must restore the visible metadata shown in the reference, including labels, status treatments, timestamps, and action affordances.

### 4. Shared Reader

This screen recreates the read-only shared document experience.

Required visual regions:

- shared-context header treatment distinct from the owner workspace
- central document-reading region
- any supporting right-side or secondary context visible in the reference
- read-only visual language with reduced editing affordances

This page should feel like a polished share view, not a duplicate of the owner workspace with controls merely hidden.

### 5. Word Lists

This screen recreates the vocabulary management view.

Required visual regions:

- app-level navigation
- section title and utility controls
- search/filter controls shown in the reference
- vocabulary list or grouped entries
- supporting metadata, tags, and explanatory content

The information density should match the reference and preserve the same balance between scanning and detail.

## Fidelity Rules

The redesign should follow these rules consistently across all five screens:

- match the visual hierarchy of the screenshots before optimizing for reuse
- match copy as closely as practical instead of reusing current placeholder text
- match spacing, border weight, radius, panel depth, and muted color layering
- match the relative proportions of columns, sidebars, and content panels
- avoid adding inferred responsive variants, hidden states, or imagined interactions

If an element is visible in the screenshot, it should appear in the rebuilt screen. If it is not visible in the screenshot, it should not be invented.

## Implementation Strategy In Pencil

The work should proceed in a fidelity-first sequence:

1. keep `Eng Copilot Landing` untouched
2. remove or replace the existing `Workflow Screens` child screens
3. rebuild the five approved screens one by one
4. compare each rebuilt screen against its source image and adjust visible deviations
5. prefer direct frame/text/shape composition over abstraction whenever abstraction harms fidelity

This is a deliberate exception to normal component-reuse instincts. The design artifact matters more than maintainable screen primitives for this task.

## Acceptance Criteria

The redesign is complete when all of the following are true:

- `Eng Copilot Landing` is unchanged
- `Workflow Screens` contains exactly the approved new screen set
- all five screens visually align with their paired reference images
- text content is materially consistent with the references
- major regions, spacing, and hierarchy match the screenshots closely enough that the source image and rebuilt frame read as the same design

## Risks And Mitigations

### Risk: Existing reusable components pull the design away from the references

Mitigation: treat reusability as optional and override or avoid existing components when necessary.

### Risk: Old workflow content accidentally remains in the file

Mitigation: replace the old workflow frames directly instead of layering the new work beside them.

### Risk: Fidelity drifts because of inferred structure

Mitigation: use the screenshots as the final arbiter for layout, copy, and visual density.
