import { WordListKind, type PrismaClient } from "@prisma/client";
import { BUILT_IN_EXCLUSION, BUILT_IN_LISTS } from "@/lib/word-lists/catalog";

export const DEFAULT_WORD_LIST_NAME = "Default Word List";
export const CUSTOM_WORD_LIST_STATUS_LABEL = "Private list";

const DEFAULT_WORD_LIST_DESCRIPTION =
  "Private starter list for words you save yourself.";
const CUSTOM_WORD_LIST_DESCRIPTION =
  "Private word list for vocabulary you want to group and revisit.";
const RESERVED_WORD_LIST_NAMES = new Set(
  [...BUILT_IN_LISTS.map((list) => list.name), BUILT_IN_EXCLUSION.name].map((name) =>
    name.toLowerCase(),
  ),
);

type OwnerWordListPrisma = Pick<PrismaClient, "wordList">;

export class WordListValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordListValidationError";
  }
}

export async function ensureOwnerDefaultWordList(input: {
  ownerId: string;
  prisma: OwnerWordListPrisma;
}) {
  const slug = buildOwnerWordListSlug({
    ownerId: input.ownerId,
    name: DEFAULT_WORD_LIST_NAME,
  });

  return input.prisma.wordList.upsert({
    where: {
      slug,
    },
    update: {},
    create: {
      kind: WordListKind.POSITIVE,
      name: DEFAULT_WORD_LIST_NAME,
      ownerId: input.ownerId,
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });
}

export async function createOwnerWordList(input: {
  ownerId: string;
  name: string;
  prisma: OwnerWordListPrisma;
}) {
  const normalizedName = normalizeWordListName(input.name);

  if (normalizedName.length === 0) {
    throw new WordListValidationError("Word list name is required");
  }

  if (RESERVED_WORD_LIST_NAMES.has(normalizedName.toLowerCase())) {
    throw new WordListValidationError("System word list names are reserved");
  }

  const slug = buildOwnerWordListSlug({
    ownerId: input.ownerId,
    name: normalizedName,
  });
  const existingWordList = await input.prisma.wordList.findFirst({
    where: {
      ownerId: input.ownerId,
      kind: WordListKind.POSITIVE,
      OR: [
        {
          name: {
            equals: normalizedName,
            mode: "insensitive",
          },
        },
        {
          slug,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (existingWordList) {
    throw new WordListValidationError("Word list already exists");
  }

  return input.prisma.wordList.create({
    data: {
      kind: WordListKind.POSITIVE,
      name: normalizedName,
      ownerId: input.ownerId,
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });
}

export async function getOwnerCustomWordLists(input: {
  ownerId: string;
  prisma: OwnerWordListPrisma;
}) {
  await ensureOwnerDefaultWordList(input);

  const wordLists = await input.prisma.wordList.findMany({
    where: {
      ownerId: input.ownerId,
      kind: WordListKind.POSITIVE,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });

  return sortOwnerWordLists(wordLists);
}

export function getCustomWordListDescription(name: string) {
  return name === DEFAULT_WORD_LIST_NAME
    ? DEFAULT_WORD_LIST_DESCRIPTION
    : CUSTOM_WORD_LIST_DESCRIPTION;
}

function normalizeWordListName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function buildOwnerWordListSlug(input: { ownerId: string; name: string }) {
  const normalizedOwnerId = input.ownerId.trim().toLowerCase();
  const normalizedName = slugify(input.name);

  return `user-${normalizedOwnerId}-${normalizedName.length > 0 ? normalizedName : "word-list"}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortOwnerWordLists<
  T extends {
    name: string;
  },
>(wordLists: T[]) {
  return [...wordLists].sort((left, right) => {
    if (left.name === DEFAULT_WORD_LIST_NAME && right.name !== DEFAULT_WORD_LIST_NAME) {
      return -1;
    }

    if (left.name !== DEFAULT_WORD_LIST_NAME && right.name === DEFAULT_WORD_LIST_NAME) {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });
}
