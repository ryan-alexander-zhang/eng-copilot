import { WordListKind, type PrismaClient } from "@prisma/client";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";
import { normalizeVocabularyWord } from "@/lib/vocabulary/normalize-word";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

const VOCABULARY_JSON_VERSION = 1;

type VocabularyPrisma = Pick<
  PrismaClient,
  | "$transaction"
  | "document"
  | "highlightMatch"
  | "vocabularyEntry"
  | "vocabularyEntryWordList"
  | "wordList"
>;

type ExportVocabularyPrisma = Pick<PrismaClient, "vocabularyEntry">;

type VocabularyEntryInput = {
  ownerId: string;
  word: string;
  source?: string;
  wordListSlugs?: string[];
  prisma: VocabularyPrisma;
  recomputeOwnerHighlights?: (input: {
    ownerId: string;
    prisma: VocabularyPrisma;
  }) => Promise<void>;
};

export type VocabularyJson = {
  version: 1;
  entries: Array<{
    word: string;
    source?: string;
    wordListSlugs?: string[];
  }>;
};

export class VocabularyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VocabularyValidationError";
  }
}

export async function saveVocabularyEntry(input: VocabularyEntryInput) {
  const normalizedWord = getRequiredNormalizedWord(input.word);
  const source = normalizeVocabularySource(input.source);
  const selectedWordLists = await getSelectableWordLists(input.prisma, input.wordListSlugs ?? []);

  const entry = await input.prisma.$transaction(async (tx) => {
    const savedEntry = await tx.vocabularyEntry.upsert({
      where: {
        ownerId_word: {
          ownerId: input.ownerId,
          word: normalizedWord,
        },
      },
      update: {
        source,
      },
      create: {
        ownerId: input.ownerId,
        word: normalizedWord,
        source,
      },
      select: {
        createdAt: true,
        id: true,
        source: true,
        updatedAt: true,
        word: true,
      },
    });

    await tx.vocabularyEntryWordList.deleteMany({
      where: {
        vocabularyEntryId: savedEntry.id,
      },
    });

    if (selectedWordLists.length > 0) {
      await tx.vocabularyEntryWordList.createMany({
        data: selectedWordLists.map((wordList) => ({
          vocabularyEntryId: savedEntry.id,
          wordListId: wordList.id,
        })),
        skipDuplicates: true,
      });
    }

    return savedEntry;
  });

  await (input.recomputeOwnerHighlights ?? recomputeOwnerVocabularyHighlights)({
    ownerId: input.ownerId,
    prisma: input.prisma,
  });

  return {
    ...entry,
    wordListSlugs: selectedWordLists.map((wordList) => wordList.slug),
  };
}

export async function importVocabularyJson(input: {
  ownerId: string;
  payload: unknown;
  prisma: VocabularyPrisma;
  recomputeOwnerHighlights?: (input: {
    ownerId: string;
    prisma: VocabularyPrisma;
  }) => Promise<void>;
}) {
  const payload = parseVocabularyJson(input.payload);
  const entriesByWord = new Map<
    string,
    {
      word: string;
      source?: string;
      wordListSlugs?: string[];
    }
  >();

  for (const entry of payload.entries) {
    entriesByWord.set(getRequiredNormalizedWord(entry.word), entry);
  }

  const results = [];
  for (const entry of entriesByWord.values()) {
    results.push(
      await saveVocabularyEntry({
        ownerId: input.ownerId,
        word: entry.word,
        source: entry.source ?? "import",
        wordListSlugs: entry.wordListSlugs ?? [],
        prisma: input.prisma,
        recomputeOwnerHighlights: async () => undefined,
      }),
    );
  }

  await (input.recomputeOwnerHighlights ?? recomputeOwnerVocabularyHighlights)({
    ownerId: input.ownerId,
    prisma: input.prisma,
  });

  return {
    importedCount: results.length,
  };
}

export async function exportVocabularyJson(input: {
  ownerId: string;
  prisma: ExportVocabularyPrisma;
}): Promise<VocabularyJson> {
  const entries = await input.prisma.vocabularyEntry.findMany({
    where: {
      ownerId: input.ownerId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      source: true,
      word: true,
      wordLists: {
        select: {
          wordList: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  return {
    version: VOCABULARY_JSON_VERSION,
    entries: entries.map((entry) => ({
      word: entry.word,
      source: entry.source,
      wordListSlugs: entry.wordLists.map((wordList) => wordList.wordList.slug),
    })),
  };
}

export async function recomputeOwnerVocabularyHighlights(input: {
  ownerId: string;
  prisma: VocabularyPrisma;
}) {
  const documents = await input.prisma.document.findMany({
    where: {
      ownerId: input.ownerId,
      trashedAt: null,
    },
    select: {
      id: true,
      activeLists: {
        select: {
          wordListId: true,
        },
      },
    },
  });

  for (const document of documents) {
    const { activeTerms, excludedTerms } = await getOwnerActiveTerms({
      ownerId: input.ownerId,
      selectedWordListIds: document.activeLists.map((list) => list.wordListId),
      prisma: input.prisma,
    });

    await recomputeDocumentHighlights({
      documentId: document.id,
      activeTerms,
      excludedTerms,
      prisma: input.prisma,
    });
  }
}

function parseVocabularyJson(payload: unknown): VocabularyJson {
  if (!isObject(payload) || payload.version !== VOCABULARY_JSON_VERSION || !Array.isArray(payload.entries)) {
    throw new VocabularyValidationError("Invalid vocabulary JSON");
  }

  return {
    version: VOCABULARY_JSON_VERSION,
    entries: payload.entries.map((entry) => {
      if (!isObject(entry) || typeof entry.word !== "string") {
        throw new VocabularyValidationError("Invalid vocabulary entry");
      }

      return {
        word: entry.word,
        source: typeof entry.source === "string" ? entry.source : undefined,
        wordListSlugs: Array.isArray(entry.wordListSlugs)
          ? entry.wordListSlugs.filter((slug): slug is string => typeof slug === "string")
          : [],
      };
    }),
  };
}

async function getSelectableWordLists(
  prisma: Pick<PrismaClient, "wordList">,
  wordListSlugs: string[],
) {
  const normalizedSlugs = [...new Set(wordListSlugs.map((slug) => slug.trim().toLowerCase()))]
    .filter((slug) => slug.length > 0);
  const selectableWordLists = await prisma.wordList.findMany({
    where: {
      kind: WordListKind.POSITIVE,
      slug: {
        in: BUILT_IN_LISTS.map((list) => list.slug),
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });
  const selectableBySlug = new Map(selectableWordLists.map((wordList) => [wordList.slug, wordList]));

  for (const slug of normalizedSlugs) {
    if (!selectableBySlug.has(slug)) {
      throw new VocabularyValidationError("Invalid word list slug");
    }
  }

  return normalizedSlugs.map((slug) => selectableBySlug.get(slug)).filter(isDefined);
}

function getRequiredNormalizedWord(word: string) {
  const normalizedWord = normalizeVocabularyWord(word);

  if (normalizedWord.length === 0) {
    throw new VocabularyValidationError("Word is required");
  }

  return normalizedWord;
}

function normalizeVocabularySource(source: string | undefined) {
  const normalizedSource = source?.trim() ?? "";

  return normalizedSource.length > 0 ? normalizedSource : "manual";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
