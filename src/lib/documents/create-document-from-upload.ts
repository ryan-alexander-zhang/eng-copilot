import type { PrismaClient } from "@prisma/client";
import { createMarkdownDocument } from "@/lib/documents/create-markdown-document";

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
  validateUpload(input.file);
  const rawMarkdown = await input.file.text();

  return createMarkdownDocument({
    ownerId: input.ownerId,
    title: getDocumentTitle(input.file.name),
    originalName: input.file.name,
    rawMarkdown,
    sourceByteSize: input.file.size,
    prisma: input.prisma,
  });
}

function validateUpload(file: File) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new DocumentUploadValidationError("Files must be 10 MB or smaller");
  }

  if (!isMarkdownFile(file)) {
    throw new DocumentUploadValidationError("Only Markdown files are supported");
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
