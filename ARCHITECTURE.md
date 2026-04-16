# Architecture

## Status

This document defines the initial architecture for the MVP.

## Product Scope

The MVP is a web application for Markdown-first reading and study workflows.

Users can:

- sign in with Google
- upload Markdown documents
- view built-in vocabulary highlights
- add persistent annotations
- share a read-only document view with other signed-in Google users

The MVP does not include:

- PDF support
- collaborative editing
- custom user-created word lists
- anonymous sharing

## Tech Stack

- Framework: `Next.js` with App Router
- Language: `TypeScript`
- Authentication: `Auth.js` with Google provider
- Database: `PostgreSQL`
- Runtime shape: modular monolith

## System Shape

The MVP should be implemented as a single Next.js application with clear server and client boundaries.

The server is responsible for:

- authentication and session handling
- document upload validation
- Markdown parsing
- built-in word list matching
- exclusion filtering
- annotation persistence
- shared-link authorization

The client is responsible for:

- rendering document content
- rendering persisted highlights
- rendering persisted annotations
- text selection for owner-created annotations
- owner-only document controls

## Storage Strategy

`PostgreSQL` is required for the MVP.

It stores:

- users
- documents
- raw Markdown content
- built-in word lists
- built-in exclusion lists
- persisted highlight matches
- annotations
- share records

The MVP should not depend on filesystem storage for uploaded documents. Raw Markdown should be stored as text in the database because the initial file format is plain text and the application needs durable, queryable, user-scoped state.

## Access Model

There are two roles in the MVP:

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
- reshare documents on behalf of the owner

## Evolution Path

If later versions add PDF support or large binary assets, document content storage can move behind a dedicated abstraction and be migrated to object storage without changing the MVP domain model.
