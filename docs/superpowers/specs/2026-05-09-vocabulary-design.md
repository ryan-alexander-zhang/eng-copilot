# Vocabulary Module Design

## Status

Approved on 2026-05-09.

## Summary

Add a user-owned Vocabulary module where authenticated users can save words, attach saved words to existing positive word lists, open dictionary and pronunciation lookup links, and import or export vocabulary data as JSON.

The module must not mutate built-in word-list entries. User vocabulary remains private and is layered into highlight recomputation for that user when a saved word is associated with a selected word list.

## Scope

In scope:

- `POST /api/vocabulary` for plugin-facing vocabulary creation
- `/vocabulary` authenticated page
- manual add word form
- lookup links for Vocabulary.com, Dictionary.com, Youdao, Collins, YouGlish US, and YouGlish UK
- JSON import and export
- per-word association with existing selectable positive word lists
- user vocabulary terms included in document highlighting when their associated word list is active

Out of scope:

- editing word definitions, examples, or notes
- creating new custom word lists
- mutating built-in `WordListEntry` rows
- bulk delete
- anonymous access

## Data Model

Add `VocabularyEntry`:

- `id`
- `ownerId`
- `word`
- `source`
- `createdAt`
- `updatedAt`
- relation to `User`
- relation to vocabulary/list joins
- unique constraint on `(ownerId, word)`

Add `VocabularyEntryWordList`:

- `id`
- `vocabularyEntryId`
- `wordListId`
- relations to `VocabularyEntry` and `WordList`
- unique constraint on `(vocabularyEntryId, wordListId)`

Saved words are normalized to lowercase trimmed text for uniqueness and highlight matching.

## API

`POST /api/vocabulary` accepts JSON:

```json
{
  "word": "observability",
  "wordListSlugs": ["cet6", "ielts"],
  "source": "plugin"
}
```

Behavior:

- requires authentication
- rejects missing or blank `word`
- validates submitted list slugs against selectable positive built-in word lists
- creates a new private vocabulary entry or updates the existing private entry for the same normalized word
- replaces that entry's word-list associations with submitted slugs
- returns the saved entry with word-list slugs

## Import And Export

Vocabulary JSON format:

```json
{
  "version": 1,
  "entries": [
    {
      "word": "observability",
      "wordListSlugs": ["cet6", "ielts"],
      "source": "manual"
    }
  ]
}
```

Import behavior:

- requires authenticated owner context
- accepts only `version: 1`
- merges by normalized `(ownerId, word)`
- updates source and word-list associations for matching words
- skips duplicate imported words after normalization by applying the last imported occurrence

Export behavior:

- exports only the current user's vocabulary
- includes associated word-list slugs
- preserves the versioned object envelope for later fields

## UI

The `/vocabulary` page follows the provided prototype within the existing app visual language:

- top navigation includes `Vocabulary`
- page title and explanatory copy
- search, word-list filter, source filter, sort select
- summary cards for total, in word lists, not in word list, and added this week
- word-list counts
- table of saved words with added date, word-list chips, lookup links dropdown, and manage/add word-list action
- add word action
- import JSON action
- export JSON action

Lookup URLs:

- `https://www.vocabulary.com/dictionary/{word}`
- `https://www.dictionary.com/browse/{word}`
- `https://www.youdao.com/result?word={word}&lang=en`
- `https://www.collinsdictionary.com/dictionary/english/{word}`
- `https://youglish.com/pronounce/{word}/english/us`
- `https://youglish.com/pronounce/{word}/english/uk`

## Highlight Integration

Highlight recomputation must include user vocabulary terms that are attached to active word lists for the owner. This applies when:

- a user changes global selected word-list preferences
- a document changes active word lists
- a new document is uploaded using the user's selected word-list preferences
- vocabulary import or creation changes word-list associations

## Testing

Unit tests cover:

- lookup URL generation
- vocabulary upsert and import/export service behavior
- API request validation and response shape
- highlight term assembly includes user vocabulary terms for selected lists
- `/vocabulary` page renders lookup links and import/export controls

