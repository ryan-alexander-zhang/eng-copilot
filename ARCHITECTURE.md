# Architecture

## Status

This document describes the current frontend and application architecture after the Lunaris-inspired UI refresh shipped on 2026-04-22.

## Product Scope

The application is a Markdown-first reading and study workspace.

Users can:

- open a public landing page that explains the product
- sign in with Google
- upload Markdown documents
- view persisted built-in vocabulary highlights
- create persistent annotations from the rendered preview
- update and delete their own annotations
- share a read-only document view with other signed-in Google users

The product still does not include:

- PDF support
- collaborative editing
- custom user-created word lists
- anonymous sharing

## Tech Stack

- Framework: `next 16.2.4` with App Router
- UI runtime: `react 19.2.5` and `react-dom 19.2.5`
- Language: `typescript 6.0.2`
- Authentication: `Auth.js` for Next.js via `next-auth 5.0.0-beta.31` with Google provider
- Styling: `tailwindcss 4.2.4`, `@tailwindcss/postcss 4.2.4`, `postcss 8.5.10`
- Motion: `framer-motion 12.38.0`
- Database: `PostgreSQL`
- Runtime shape: modular monolith

The package versions above were checked on 2026-04-22 with `npm view <package> version`.

## Frontend Delivery Model

The frontend uses the Lunaris UI delivery model rather than a published npm component package.

That means:

- Tailwind CSS and Framer Motion are installed as project dependencies
- Lunaris-inspired components are implemented locally inside the repo
- copied and adapted snippet code is treated as application code, not as a third-party runtime dependency

The `ui.pen` file is the main structural and visual reference for the current page set.

## Presentation Zones

The UI is split into four presentation zones.

### Public Marketing

Owned route:

- `/`

Responsibilities:

- provide a public landing page
- explain the product workflow
- direct users to sign-in or the authenticated workspace

### Authenticated App Shell

Owned routes:

- `/documents`
- `/documents/new`
- `/documents/[documentId]`

Responsibilities:

- enforce owner authentication
- provide the shared authenticated frame and navigation
- keep document management screens visually consistent

### Owner Document Workspace

Owned route:

- `/documents/[documentId]`

Responsibilities:

- render document metadata
- manage built-in highlight list toggles
- manage share state
- render the Markdown preview
- create, update, and delete annotations

### Shared Read-Only Reader

Owned route:

- `/shared/[token]`

Responsibilities:

- require Google authentication
- render the same persisted blocks, highlights, and annotations as the owner view
- remove all owner-only mutation controls

## Server And Client Boundaries

The server is responsible for:

- authentication and session handling
- document upload validation
- Markdown parsing
- built-in word list matching
- exclusion filtering
- annotation persistence
- shared-link authorization
- revalidating document pages after mutations

The client is responsible for:

- rendering document content and preview slices
- rendering persisted highlights and annotations
- mapping text selections back to block keys and offsets
- opening the annotation context menu and creation dialog in the owner workspace
- rendering owner-only UI controls and shared read-only UI variants

## Annotation Workflow

The application no longer creates annotations through manual block and offset entry in a side form.

The current owner flow is:

1. select text in the rendered preview
2. right-click a valid selection
3. open a lightweight context menu with `Create annotation`
4. confirm the selection and note in a dialog
5. submit the existing server-side anchor contract:
   - `startBlockKey`
   - `startOffset`
   - `endBlockKey`
   - `endOffset`
   - `note`

Annotation editing and deletion remain in the annotation list panel.

Shared readers can view annotations but cannot create, edit, or delete them.

## Rendering Model

Document content is still rendered from persisted block records with stable `blockKey` anchors.

The preview renderer:

- preserves block identity in the DOM
- splits text into deterministic slices at highlight and annotation boundaries
- maps browser selections back to persisted block offsets
- applies visual precedence so annotation styling wins over word-highlight styling when the same range has both states

Visual semantics:

- word-list highlights use a warm yellow palette
- annotations use a distinct blue-cyan palette

## Storage Strategy

`PostgreSQL` stores:

- users
- documents
- raw Markdown content
- parsed blocks
- built-in word lists
- built-in exclusion lists
- persisted highlight matches
- annotations
- share records

The application does not depend on filesystem storage for uploaded documents. Raw Markdown remains persisted as text in the database.

## Access Model

There are still two roles:

- owner: the authenticated user who uploaded the document
- shared viewer: any signed-in Google user who opens a valid shared link

Owners can:

- upload documents
- toggle built-in positive lists for a document
- create, edit, and delete annotations
- enable or revoke sharing

Shared viewers can:

- view the document
- view the owner's highlights
- view the owner's annotations

Shared viewers cannot:

- edit documents
- change list settings
- create annotations
- edit annotations
- delete annotations
- reshare documents on behalf of the owner

## Evolution Path

If later versions add PDF support or larger binary assets, document content can move behind a dedicated storage abstraction without changing the current owner/shared reader model.
