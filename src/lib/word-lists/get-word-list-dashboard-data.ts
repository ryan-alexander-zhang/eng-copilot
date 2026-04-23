import type { PrismaClient } from "@prisma/client";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

type WordListDashboardPrisma = Pick<
  PrismaClient,
  "document" | "userWordListPreference" | "wordList"
>;

export async function getWordListDashboardData(input: {
  ownerId: string;
  prisma: WordListDashboardPrisma;
}) {
  const [wordLists, selectedPrefs, documents] = await Promise.all([
    input.prisma.wordList.findMany({
      where: {
        slug: {
          in: BUILT_IN_LISTS.map((list) => list.slug),
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        updatedAt: true,
        entries: {
          select: {
            term: true,
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
  const lists = BUILT_IN_LISTS.map((catalogEntry) => {
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
      wordCount: catalogEntry.displayWordCount,
      isSelected: selectedWordListIds.has(wordList.id),
    };
  }).filter((wordList): wordList is NonNullable<typeof wordList> => wordList !== null);
  const documentsWithHighlights = documents.filter((document) => document.highlightMatches.length > 0);
  const topTerms = [...documents.flatMap((document) => document.highlightMatches)]
    .reduce<Map<string, number>>((counts, match) => {
      counts.set(match.term, (counts.get(match.term) ?? 0) + 1);
      return counts;
    }, new Map())
    .entries();
  const sortedTopTerms = [...topTerms]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([term]) => term);
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
    sampleMatchedWords: sortedTopTerms,
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
