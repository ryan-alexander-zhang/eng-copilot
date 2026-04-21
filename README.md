# eng-copilot

Markdown-first reading with built-in vocabulary highlights, annotations, and authenticated share links.

## Local Development

1. Copy `.env.example` to `.env.local` and set:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` as `http://127.0.0.1:3000`
2. Install dependencies with `npm install`.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply your local Prisma migration workflow and seed built-in word lists with `npm run db:seed`.
5. Start the app with `npm run dev -- --hostname 127.0.0.1 --port 3000`.

## Tests

- Unit tests: `npm test`
- E2E: `npm run test:e2e -- tests/e2e/owner-upload-and-share.spec.ts`

The Playwright E2E seeds NextAuth database sessions directly for owner and viewer contexts. It does not run real Google OAuth.

The spec also upserts the minimal built-in word-list entries it needs for highlight assertions, so it does not depend on pre-seeded CET data.

When `DATABASE_URL` or `NEXTAUTH_SECRET` is missing, the E2E skips with a clear reason instead of crashing. When those env vars are present, Playwright auto-starts the local Next.js app on `http://127.0.0.1:3000`.

## Operations

- Real Google auth smoke checklist: [docs/operations/google-auth-smoke-checklist.md](docs/operations/google-auth-smoke-checklist.md)
