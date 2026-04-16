# Markdown Word Annotation MVP Spec

## Status

Approved MVP spec.

## Summary

The system is a web application for reading uploaded Markdown documents with a persistent study layer.

The study layer includes:

- built-in vocabulary highlights
- built-in exclusion filtering
- owner-created annotations
- authenticated read-only sharing

## In Scope

- Google sign-in
- Markdown file upload
- server-side Markdown parsing
- built-in positive word lists such as `CET4` and `CET6`
- built-in exclusion list
- per-document enabling and disabling of built-in positive lists
- persisted highlight results
- owner-created annotations on document text
- authenticated read-only sharing for signed-in Google users with the link

## Out of Scope

- PDF upload or parsing
- collaborative editing
- anonymous sharing
- user-created positive word lists
- user-imported positive word lists
- user-managed exclusion lists
- in-place source editing for uploaded documents

## Actors

### Owner

The authenticated user who uploads and manages a document.

### Shared Viewer

An authenticated Google user who opens a valid read-only shared link.

## Core Entities

### User

Represents an authenticated application user.

### Document

Represents one uploaded Markdown file and its persisted reading state.

Required document state:

- owner identity
- original filename
- raw Markdown content
- parsed renderable content
- active built-in positive lists
- persisted highlight matches
- share status
- timestamps

### DocumentShare

Represents read-only access to a document through a share link.

Required share behavior:

- one active share link per document in MVP
- access requires Google sign-in
- access is read-only
- revocation takes effect immediately

### BuiltInWordList

Represents a system-provided positive list used to determine vocabulary highlights.

### BuiltInExclusionList

Represents a system-provided exclusion list used to suppress unwanted highlights.

### HighlightMatch

Represents a persisted match between document content and the effective active word lists after exclusion filtering.

### Annotation

Represents an owner-created note attached to a text selection within a document.

## Functional Requirements

### Authentication

- The system must support sign-in with Google through `Auth.js`.
- The system must require authentication for owners.
- The system must require authentication for shared viewers.
- The system must not allow anonymous document access in MVP.

### Document Upload

- The system must allow an authenticated owner to upload a Markdown file.
- The system must reject non-Markdown files.
- The system must enforce a documented upload size limit.
- The system must store the raw Markdown content durably after a successful upload.
- The system must parse uploaded Markdown into a renderable representation.

### Document Lifecycle

- Each uploaded file must create a new document record.
- The uploaded source content must be immutable in MVP.
- Replacing source content must be modeled as uploading a new document, not editing an existing one.
- A document with no matching words must still render successfully.
- A document with no annotations must still render successfully.

### Built-In Positive Lists

- The system must provide built-in positive lists for the MVP.
- The built-in list catalog must include at least `CET4` and `CET6`.
- A newly uploaded document must start with no built-in positive lists enabled by default.
- The owner must be able to enable or disable built-in positive lists per document.
- When the owner changes active built-in positive lists, the system must recompute and persist the document's highlight state.
- Shared viewers must not be able to change list activation.
- The system must not expose UI for creating or importing custom positive lists in MVP.

### Built-In Exclusion List

- The system must apply a built-in exclusion list to suppress unwanted highlights.
- The exclusion list must be system-provided in MVP.
- The owner must not be able to edit the exclusion list in MVP.
- Shared viewers must not be able to edit the exclusion list in MVP.

### Highlight Computation

- The system must compute highlights from the document content using the active built-in positive lists.
- The system must remove matches that appear in the built-in exclusion list.
- The system must persist computed highlight results.
- The system must render persisted highlight results consistently across sessions.
- The shared read-only view must display the same persisted highlight state that the owner sees.

### Annotation Behavior

- The owner must be able to select arbitrary text in a document and attach an annotation.
- The owner must be able to reopen, edit, and delete an existing annotation.
- The system must persist annotations across sessions.
- The shared read-only view must display the owner's current annotations.
- Shared viewers must not be able to create annotations.
- Shared viewers must not be able to edit or delete annotations.

### Sharing

- The owner must be able to enable a share link for a document.
- The owner must be able to revoke the share link.
- The share link must allow access to any signed-in Google user who has the link.
- The share link must not allow access to anonymous users.
- The shared view must include the owner's highlights.
- The shared view must include the owner's annotations.
- The shared view must not expose owner-only editing controls.
- The shared view must not allow resharing on behalf of the owner in MVP.

## Processing Rules

### Upload Processing

After a successful upload, the system must:

1. validate file type and size
2. persist the raw Markdown source
3. parse the Markdown into a renderable form
4. evaluate the content against the document's current active built-in positive lists
5. apply the built-in exclusion list
6. persist the resulting highlight matches
7. render the document with highlights available

### Highlight Stability

- Highlights must be derived from persisted results, not only from transient client-side computation.
- The same document and same active list configuration must produce the same visible highlight state across sessions.
- Shared viewers must see the latest persisted highlight state.
- Changes to the built-in list catalog must not silently change an existing document's visible highlights until that document is explicitly recomputed by application logic.

### Share Revocation

- Revoking a share link must block future shared access immediately.
- Revocation must not delete the document or its annotations.

## Error Handling

- The system must return a clear validation error for unsupported file types.
- The system must return a clear validation error for oversized uploads.
- The system must treat empty Markdown files as valid documents in MVP.
- If parsing fails, the upload must fail with a recoverable error message rather than creating a partially available document.
- If a shared viewer opens a revoked or invalid link, the system must show an authorization or not-found state without exposing document content.

## Privacy And Access Constraints

- A document owner can access and manage only their own documents.
- A shared viewer can access only documents with a valid active share link.
- Shared viewers can view the published study layer but cannot mutate it.
- The system must not expose owner-only management screens to shared viewers.

## Non-Functional Requirements

- The application must preserve document, highlight, and annotation state across sessions.
- The system must support deterministic rendering of persisted study state for both owners and shared viewers.
- The architecture must use `Next.js`, `TypeScript`, `Auth.js`, and `PostgreSQL` for the MVP.
- The storage design must not depend on local server filesystem persistence for uploaded Markdown files.

## Testing Requirements

### Unit Tests

- word-list matching behavior
- exclusion filtering behavior
- annotation anchoring behavior
- share-authorization decision logic

### Integration Tests

- Markdown upload validation
- document persistence
- highlight persistence
- annotation persistence
- share-link creation
- share-link revocation
- owner-only mutation enforcement

### End-to-End Tests

- Google sign-in
- Markdown upload
- built-in highlight rendering
- annotation creation and editing by owner
- shared read-only access by another signed-in Google user
- loss of access after share revocation

## Acceptance Criteria

- An authenticated owner can upload a Markdown file and read it in the application.
- The owner can enable built-in positive lists and see persisted highlights after exclusion filtering.
- The owner can create persistent annotations on document text.
- A second signed-in Google user with the share link can open the read-only view and see the owner's highlights and annotations.
- The second user cannot modify annotations or list settings.
- Revoking the share link prevents future access to the shared view.
