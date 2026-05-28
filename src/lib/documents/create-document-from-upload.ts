import { Prisma, type PrismaClient } from "@prisma/client";
import { computeHighlightMatches } from "@/lib/highlights/compute-highlight-matches";
import { getOwnerActiveTerms } from "@/lib/highlights/get-owner-active-terms";
import { parseMarkdownToRenderProjection } from "@/lib/markdown/parse-markdown-to-render-projection";
import { parsePdfToPageProjection, PdfUploadValidationError } from "@/lib/pdf/parse-pdf-to-page-projection";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MARKDOWN_FILE_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd"];
const PDF_FILE_EXTENSIONS = [".pdf"];
const MARKDOWN_CONTENT_TYPES = new Set([
  "application/markdown",
  "text/markdown",
  "text/x-markdown",
]);
const PDF_CONTENT_TYPES = new Set(["application/pdf"]);

type SupportedUploadFormat = "MARKDOWN" | "PDF";

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
  const format = validateUpload(input.file);
  const parsedDocument = await parseUploadedDocument({
    file: input.file,
    format,
  });
  const { activeTerms, excludedTerms, selectedWordListIds } = await getOwnerWordListSelection({
    ownerId: input.ownerId,
    prisma: input.prisma,
  });
  const highlightMatches = computeHighlightMatches({
    blocks: parsedDocument.blocks,
    activeTerms,
    excludedTerms,
  });

  return input.prisma.document.create({
    data: {
      ownerId: input.ownerId,
      title: getDocumentTitle(input.file.name),
      originalName: input.file.name,
      sourceFormat: parsedDocument.sourceFormat,
      rawMarkdown: parsedDocument.rawMarkdown,
      plainText: parsedDocument.plainText,
      sourceByteSize: parsedDocument.sourceByteSize,
      pdfData: parsedDocument.pdfData,
      renderProjectionVersion: parsedDocument.renderProjectionVersion,
      ...(parsedDocument.blocks.length > 0
        ? {
            blocks: {
              create: parsedDocument.blocks.map((block) => ({
                blockKey: block.blockKey,
                blockPath: block.blockPath,
                sortOrder: block.sortOrder,
                kind: block.kind,
                selectable: block.selectable,
                attrs: block.attrs ?? Prisma.JsonNull,
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

function validateUpload(file: File): SupportedUploadFormat {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new DocumentUploadValidationError("Files must be 10 MB or smaller");
  }

  if (isMarkdownFile(file)) {
    return "MARKDOWN";
  }

  if (isPdfFile(file)) {
    return "PDF";
  }

  throw new DocumentUploadValidationError("Only Markdown and PDF files are supported");
}

function isMarkdownFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  const normalizedType = file.type.toLowerCase();

  return (
    MARKDOWN_FILE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension)) ||
    MARKDOWN_CONTENT_TYPES.has(normalizedType)
  );
}

function isPdfFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  const normalizedType = file.type.toLowerCase();

  return (
    PDF_FILE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension)) ||
    PDF_CONTENT_TYPES.has(normalizedType)
  );
}

function getDocumentTitle(fileName: string) {
  const strippedExtension = fileName.replace(/\.(md|markdown|mdown|mkd|pdf)$/i, "").trim();

  return strippedExtension.length > 0 ? strippedExtension : fileName;
}

async function parseUploadedDocument(input: {
  file: File;
  format: SupportedUploadFormat;
}) {
  if (input.format === "MARKDOWN") {
    const rawMarkdown = await input.file.text();
    const blocks = parseMarkdownToRenderProjection(rawMarkdown);

    return {
      sourceFormat: "MARKDOWN" as const,
      rawMarkdown,
      plainText: blocks.map((block) => block.text).join("\n\n"),
      sourceByteSize: input.file.size,
      pdfData: null,
      renderProjectionVersion: 2,
      blocks,
    };
  }

  try {
    const pdfArrayBuffer = await input.file.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    const pdfData = Buffer.from(pdfBytes);
    const parsedPdf = await parsePdfToPageProjection(pdfBytes);

    return {
      sourceFormat: "PDF" as const,
      rawMarkdown: null,
      plainText: parsedPdf.plainText,
      sourceByteSize: input.file.size,
      pdfData,
      renderProjectionVersion: 3,
      blocks: parsedPdf.blocks,
    };
  } catch (error) {
    if (error instanceof PdfUploadValidationError) {
      throw new DocumentUploadValidationError(error.message);
    }

    throw error;
  }
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
