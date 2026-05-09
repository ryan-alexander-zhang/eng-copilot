import { type PrismaClient } from "@prisma/client";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MARKDOWN_FILE_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd"];
const MARKDOWN_CONTENT_TYPES = new Set([
  "application/markdown",
  "text/markdown",
  "text/x-markdown",
]);

type CreateDocumentFromUploadInput = {
  ownerId: string;
  file: File;
  prisma: Pick<PrismaClient, "document"> &
    Partial<Pick<PrismaClient, "wordList" | "userWordListPreference" | "vocabularyEntry">>;
};

export class DocumentUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentUploadValidationError";
  }
}

export async function createDocumentFromUpload(input: CreateDocumentFromUploadInput) {
  validateMarkdownUpload(input.file);

  const rawMarkdown = await input.file.text();
  const blocks = parseMarkdownToBlocks(rawMarkdown);
  const { activeTerms, excludedTerms, selectedWordListIds } = await getOwnerWordListSelection({
    ownerId: input.ownerId,
    prisma: input.prisma,
  });
  const highlightMatches = computeHighlightMatches({
    blocks,
    activeTerms,
    excludedTerms,
  });

  return input.prisma.document.create({
    data: {
      ownerId: input.ownerId,
      title: getDocumentTitle(input.file.name),
      originalName: input.file.name,
      rawMarkdown,
      ...(blocks.length > 0
        ? {
            blocks: {
              create: blocks.map((block) => ({
                blockKey: block.blockKey,
                sortOrder: block.sortOrder,
                kind: block.kind,
                text: block.text,
              })),
            },
          }
        : {}),
      ...(selectedWordListIds.length > 0
        ? {
            activeLists: {
              create: selectedWordListIds.map((wordListId) => ({
                wordListId,
              })),
            },
          }
        : {}),
      ...(highlightMatches.length > 0
        ? {
            highlightMatches: {
              create: highlightMatches.map((match) => ({
                blockKey: match.blockKey,
                startOffset: match.startOffset,
                endOffset: match.endOffset,
                term: match.term,
              })),
            },
          }
        : {}),
    },
  });
}

function validateMarkdownUpload(file: File) {
  if (!isMarkdownFile(file)) {
    throw new DocumentUploadValidationError("Only Markdown files are supported");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new DocumentUploadValidationError("Markdown files must be 512 KB or smaller");
  }
}

function isMarkdownFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  const normalizedType = file.type.toLowerCase();

  return (
    MARKDOWN_FILE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension)) ||
    MARKDOWN_CONTENT_TYPES.has(normalizedType)
  );
}

function getDocumentTitle(fileName: string) {
  const strippedExtension = fileName.replace(/\.(md|markdown|mdown|mkd)$/i, "").trim();

  return strippedExtension.length > 0 ? strippedExtension : fileName;
}

async function getOwnerWordListSelection(input: {
  ownerId: string;
  prisma: Partial<Pick<PrismaClient, "wordList" | "userWordListPreference" | "vocabularyEntry">>;
}) {
  if (!("userWordListPreference" in input.prisma) || !("wordList" in input.prisma)) {
    return {
      selectedWordListIds: [],
      activeTerms: new Set<string>(),
      excludedTerms: new Set<string>(),
    };
  }

  return getOwnerActiveTerms({
    ownerId: input.ownerId,
    prisma: input.prisma as Pick<PrismaClient, "wordList" | "userWordListPreference"> &
      Partial<Pick<PrismaClient, "vocabularyEntry">>,
  });
}
