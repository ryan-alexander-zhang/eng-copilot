# Built-In Word List Update Runbook

Use this runbook when you update any built-in word list source file under `vendor/word-lists/`.

## Files Covered

- `vendor/word-lists/cet4.txt`
- `vendor/word-lists/cet6.txt`
- `vendor/word-lists/exclusion.txt`

## How It Works

The application does not read these text files on each request. Built-in word lists are loaded into PostgreSQL by `prisma/seed.ts`, and the reader uses the database state.

Because of that, editing a text file alone does not change the app behavior until the database is reseeded.

## Update Procedure

1. Edit the source file under `vendor/word-lists/`.
2. Run `npm run db:seed`.
3. You do not need to restart the app.

## Existing Documents

Existing documents do not update automatically after a built-in list changes.

To apply the updated list contents to an existing document:

1. Open the document in the app.
2. Toggle the relevant built-in list off.
3. Toggle the same list back on.

That action triggers highlight recomputation for the document with the current database-backed list contents.

## Verification

1. Open a document that should contain one of the updated terms.
2. Confirm the relevant built-in list is enabled.
3. If the document existed before the list change, toggle the list off and on once.
4. Confirm the highlight state matches the updated list content.
