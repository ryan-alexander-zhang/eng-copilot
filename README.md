# eng-copilot

Markdown-first reading with built-in vocabulary highlights, annotations, and authenticated share links.

## Local Development

1. Copy `.env.example` to `.env` if you do not already have one.
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
3. Set `NEXTAUTH_SECRET` in `.env`.
4. Use the local Postgres credentials from `docker-compose.yml`:
   - database: `eng_copilot`
   - username: `eng_copilot`
   - password: `eng_copilot`
   - `DATABASE_URL="postgresql://eng_copilot:eng_copilot@localhost:5432/eng_copilot?schema=public"`
5. Keep `NEXTAUTH_URL="http://localhost:3000"` unless your Google OAuth redirect URI is configured differently.
6. Start Postgres with `docker compose up -d postgres`.
7. Install dependencies with `npm install`.
8. Generate the Prisma client with `npm run db:generate`.
9. Push the schema into the local database with `npm run db:push`.
10. Seed the built-in word lists with `npm run db:seed`.
11. Start the app with `npm run dev`.

This project is a single Next.js application. Running `npm run dev` starts both the frontend and the server-side backend routes locally.

## Built-In Word List Updates

Built-in lists are loaded from `vendor/word-lists/*.txt` into PostgreSQL by the seed script. The app does not read those text files on each request.

If you update `vendor/word-lists/cet4.txt`, `vendor/word-lists/cet6.txt`, or `vendor/word-lists/exclusion.txt`:

1. Run `npm run db:seed` to sync the updated list into the database.
2. You do not need to restart the app.
3. Existing documents will not change automatically. To apply the new list contents to an existing document, open the document and toggle the relevant built-in list off and on again so the highlights are recomputed.

## Google OAuth Setup

1. Open Google Cloud Console and create or select a project.
2. Configure the OAuth consent screen for the Google accounts you want to use in development.
3. Create an `OAuth 2.0 Client ID` with application type `Web application`.
4. Add the local origin:
   - `http://localhost:3000`
5. Add the local redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
6. Copy the generated client id and client secret into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
7. Keep `NEXTAUTH_URL` aligned with the same host used in the OAuth client. If you switch to `127.0.0.1`, update both the Google OAuth client and `.env`.

## Tests

- Unit tests: `npm test`
- E2E: `npm run test:e2e -- tests/e2e/owner-upload-and-share.spec.ts`

The Playwright E2E seeds Auth.js database sessions directly for owner and viewer contexts. It does not run real Google OAuth.

The spec expects the built-in word lists to exist in the database, so run `npm run db:seed` before E2E.

When `DATABASE_URL` or `NEXTAUTH_SECRET` is missing, or the built-in word lists have not been seeded, the E2E skips with a clear reason instead of crashing. When those env vars are present, Playwright starts its own local Next.js app on `http://127.0.0.1:3000` for the run.

## Operations

- Real Google auth smoke checklist: [docs/operations/google-auth-smoke-checklist.md](docs/operations/google-auth-smoke-checklist.md)
- Built-in word list update runbook: [docs/operations/built-in-word-list-update-runbook.md](docs/operations/built-in-word-list-update-runbook.md)
