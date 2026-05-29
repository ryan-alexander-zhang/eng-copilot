import { Prisma, type PrismaClient } from "@prisma/client";
import { createMarkdownDocument } from "@/lib/documents/create-markdown-document";
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
  if (format === "MARKDOWN") {
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

  const parsedDocument = await parsePdfUpload(input.file);

  return input.prisma.document.create({
    data: {
      ownerId: input.ownerId,
      title: getDocumentTitle(input.file.name),
      originalName: input.file.name,
      sourceUrl: null,
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

async function parsePdfUpload(file: File) {
  try {
    const pdfArrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    const pdfData = Buffer.from(pdfBytes);
    const parsedPdf = await parsePdfToPageProjection(pdfBytes);

    return {
      sourceFormat: "PDF" as const,
      rawMarkdown: null,
      plainText: parsedPdf.plainText,
      sourceByteSize: file.size,
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
