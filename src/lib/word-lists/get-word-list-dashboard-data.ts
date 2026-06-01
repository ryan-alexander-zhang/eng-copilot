import { WordListKind, type PrismaClient } from "@prisma/client";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";
import {
  CUSTOM_WORD_LIST_STATUS_LABEL,
  getCustomWordListDescription,
  getOwnerCustomWordLists,
} from "@/lib/word-lists/service";

type WordListDashboardPrisma = Pick<
  PrismaClient,
  "document" | "userWordListPreference" | "wordList"
>;

const DESIGN_SAMPLE_MATCHED_WORDS = [
  "adaptability",
  "critical",
  "opportunities",
  "sustainable",
  "analyze",
  "...",
];

export async function getWordListDashboardData(input: {
  ownerId: string;
  prisma: WordListDashboardPrisma;
}) {
  const customWordLists = await getOwnerCustomWordLists({
    ownerId: input.ownerId,
    prisma: input.prisma,
  });
  const [wordLists, selectedPrefs, documents] = await Promise.all([
    input.prisma.wordList.findMany({
      where: {
        kind: WordListKind.POSITIVE,
        OR: [
          {
            slug: {
              in: BUILT_IN_LISTS.map((list) => list.slug),
            },
          },
          {
            ownerId: input.ownerId,
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerId: true,
        updatedAt: true,
        _count: {
          select: {
            entries: true,
            vocabularyEntries: true,
          },
        },
      },
    }),
    input.prisma.userWordListPreference.findMany({
      where: {
        userId: input.ownerId,
      },
      select: {
        wordListId: true,
      },
    }),
    input.prisma.document.findMany({
      where: {
        ownerId: input.ownerId,
        sourceFormat: "MARKDOWN",
        trashedAt: null,
      },
      select: {
        id: true,
        highlightMatches: {
          select: {
            term: true,
          },
        },
      },
    }),
  ]);
  const selectedWordListIds = new Set(selectedPrefs.map((preference) => preference.wordListId));
  const builtInLists = BUILT_IN_LISTS.map((catalogEntry) => {
    const wordList = wordLists.find((candidate) => candidate.slug === catalogEntry.slug);

    if (!wordList) {
      return null;
    }

    return {
      id: wordList.id,
      slug: wordList.slug,
      name: wordList.name,
      description: catalogEntry.description,
      updatedAt: wordList.updatedAt,
      syncedLabel: catalogEntry.syncedLabel,
      wordCount: wordList._count.entries,
      isSelected: selectedWordListIds.has(wordList.id),
    };
  }).filter((wordList): wordList is NonNullable<typeof wordList> => wordList !== null);
  const customWordListIds = new Set(customWordLists.map((wordList) => wordList.id));
  const customLists = wordLists
    .filter((wordList) => customWordListIds.has(wordList.id))
    .map((wordList) => ({
      id: wordList.id,
      slug: wordList.slug,
      name: wordList.name,
      description: getCustomWordListDescription(wordList.name),
      updatedAt: wordList.updatedAt,
      syncedLabel: CUSTOM_WORD_LIST_STATUS_LABEL,
      wordCount: wordList._count.vocabularyEntries,
      isSelected: selectedWordListIds.has(wordList.id),
    }));
  const lists = [...builtInLists, ...customLists];
  const documentsWithHighlights = documents.filter((document) => document.highlightMatches.length > 0);
  const coverageRatio =
    documents.length === 0 ? 0 : documentsWithHighlights.length / documents.length;

  return {
    lists,
    selectedCount: lists.filter((list) => list.isSelected).length,
    totalSelectedWords: lists
      .filter((list) => list.isSelected)
      .reduce((sum, list) => sum + list.wordCount, 0),
    documentsCount: documents.length,
    documentsWithHighlightsCount: documentsWithHighlights.length,
    coverage: buildCoverage(coverageRatio),
    sampleMatchedWords: DESIGN_SAMPLE_MATCHED_WORDS,
  };
}

function buildCoverage(ratio: number) {
  if (ratio >= 0.67) {
    return {
      label: "High",
      toneClassName: "text-[#35A853]",
      progressClassName: "bg-[#56C271]",
      ratio,
      description: "Great coverage across your uploaded library.",
    };
  }

  if (ratio >= 0.34) {
    return {
      label: "Medium",
      toneClassName: "text-[#C18B1C]",
      progressClassName: "bg-[#F3B846]",
      ratio,
      description: "A useful mix of highlighted terms across your documents.",
    };
  }

  return {
    label: "Low",
    toneClassName: "text-[#8C949F]",
    progressClassName: "bg-[#C8CDD5]",
    ratio,
    description: "Select more lists or upload more content to surface matches.",
  };
}
