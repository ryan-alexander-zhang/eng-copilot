import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ProjectionBlock } from "@/lib/markdown/types";
import { buildPdfPageText, type MinimalPdfTextItem } from "@/lib/pdf/build-pdf-page-text";

const MIN_TEXT_BEARING_CHARACTERS = 24;
const MIN_TEXT_BEARING_ITEMS = 6;

export type ParsedPdfProjection = {
  blocks: ProjectionBlock[];
  plainText: string;
  pageCount: number;
  nonTextPages: number;
};

export class PdfUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfUploadValidationError";
  }
}

export async function parsePdfToPageProjection(bytes: Uint8Array): Promise<ParsedPdfProjection> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const standardFontDataUrl = `${pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts"),
  ).toString()}/`;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    stopAtErrors: true,
    standardFontDataUrl,
  });

  let pdfDocument: Awaited<typeof loadingTask.promise>;

  try {
    pdfDocument = await loadingTask.promise;
  } catch (error) {
    throw normalizePdfLoadError(error);
  }

  const blocks: ProjectionBlock[] = [];
  let nonTextPages = 0;

  try {
    for (let pageIndex = 0; pageIndex < pdfDocument.numPages; pageIndex += 1) {
      const pageNumber = pageIndex + 1;
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const items: MinimalPdfTextItem[] = textContent.items.flatMap((item) =>
        isPdfTextItem(item)
          ? [{
              str: item.str,
              hasEOL: item.hasEOL,
            }]
          : [],
      );
      const pageText = buildPdfPageText(items);

      if (!isTextBearingPage(pageText)) {
        nonTextPages += 1;
      }

      blocks.push({
        blockKey: buildPdfPageBlockKey({
          pageNumber,
          text: pageText.text,
        }),
        blockPath: `page:${pageNumber}`,
        sortOrder: pageIndex,
        kind: "pdf-page",
        selectable: true,
        attrs: {
          pageNumber,
          width: viewport.width,
          height: viewport.height,
          rotation: page.rotate,
        },
        text: pageText.text,
      });
    }
  } finally {
    await loadingTask.destroy();
  }

  validatePdfProjection({
    blocks,
    nonTextPages,
  });

  return {
    blocks,
    plainText: blocks.map((block) => block.text).join("\n\n"),
    pageCount: blocks.length,
    nonTextPages,
  };
}

export function isTextBearingPage(input: Pick<ReturnType<typeof buildPdfPageText>, "nonWhitespaceChars" | "textItemCount">) {
  return (
    input.nonWhitespaceChars >= MIN_TEXT_BEARING_CHARACTERS ||
    input.textItemCount >= MIN_TEXT_BEARING_ITEMS
  );
}

function validatePdfProjection(input: {
  blocks: ProjectionBlock[];
  nonTextPages: number;
}) {
  if (input.blocks.length === 0) {
    throw new PdfUploadValidationError("The PDF could not be parsed");
  }

  const allowedNonTextPages = Math.max(1, Math.floor(input.blocks.length * 0.1));

  if (input.nonTextPages > allowedNonTextPages) {
    throw new PdfUploadValidationError(
      "Scanned PDFs are not supported yet; upload a text-based PDF instead",
    );
  }
}

function normalizePdfLoadError(error: unknown) {
  if (isPasswordError(error)) {
    return new PdfUploadValidationError("Password-protected PDFs are not supported");
  }

  return new PdfUploadValidationError("The PDF could not be parsed");
}

function isPasswordError(error: unknown) {
  return error instanceof Error && /password/i.test(error.name + error.message);
}

function isPdfTextItem(item: unknown): item is MinimalPdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof item.str === "string"
  );
}

function buildPdfPageBlockKey(input: { pageNumber: number; text: string }) {
  const textHash = createHash("sha1")
    .update(`pdf-page:${input.pageNumber}:${input.text}`)
    .digest("hex")
    .slice(0, 8);

  return `pdf-page:${input.pageNumber}:${textHash}`;
}
