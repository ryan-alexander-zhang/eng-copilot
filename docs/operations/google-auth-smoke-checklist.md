# Google Auth Smoke Checklist

Use this checklist for a real Google-auth smoke test. The automated Playwright spec seeds NextAuth sessions directly and does not exercise Google OAuth.

## Prerequisites

- Local PostgreSQL is running and `DATABASE_URL` points at the app database.
- `NEXTAUTH_SECRET` is set.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set to a working Google OAuth app.
- `NEXTAUTH_URL` matches the local app URL, usually `http://127.0.0.1:3000` or `http://localhost:3000`.
- `npm install` has been run.
- `npm run db:generate` and `npm run db:seed` have been run.

## Smoke Flow

1. Start the app with `npm run dev -- --hostname 127.0.0.1 --port 3000`.
2. Open the app in a clean browser session.
3. Sign in with the owner Google account.
4. Upload a Markdown file.
5. Open the uploaded document.
6. Enable at least one built-in highlight list and confirm highlighted terms appear in the reader.
7. Create an annotation and confirm the quote and note are visible.
8. Enable the share link and copy the generated `/shared/<token>` URL.
9. Sign out or switch to a second clean browser session.
10. Open the share URL while signed out and confirm redirect to `/sign-in`.
11. Sign in with a different Google account.
12. Confirm the shared document opens in read-only mode.
13. Confirm the shared reader shows the owner's highlight and annotation state.
14. Confirm owner-only controls are absent in the shared view.

## Expected Result

- Google sign-in succeeds for both accounts.
- Owner upload, list toggle, annotation, and share flows work.
- Anonymous viewers are redirected to sign in before shared access.
- Authenticated viewers can open the shared link in read-only mode.
