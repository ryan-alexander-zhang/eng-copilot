import { describe, expect, it } from "vitest";
import {
  parsePdfToPageProjection,
} from "@/lib/pdf/parse-pdf-to-page-projection";
import { createBlankPdf, createTextPdf } from "../../fixtures/pdf-fixtures";

describe("parsePdfToPageProjection", () => {
  it("builds deterministic page blocks from a text PDF", async () => {
    const firstPageText = "Hello PDF with enough text to count.";
    const secondPageText = "Second page also carries enough text.";
    const projection = await parsePdfToPageProjection(
      createTextPdf([firstPageText, secondPageText]),
    );

    expect(projection.pageCount).toBe(2);
    expect(projection.nonTextPages).toBe(0);
    expect(projection.plainText).toBe(`${firstPageText}\n\n${secondPageText}`);
    expect(projection.blocks).toEqual([
      expect.objectContaining({
        blockPath: "page:1",
        kind: "pdf-page",
        selectable: true,
        sortOrder: 0,
        text: firstPageText,
        attrs: expect.objectContaining({
          pageNumber: 1,
        }),
      }),
      expect.objectContaining({
        blockPath: "page:2",
        kind: "pdf-page",
        selectable: true,
        sortOrder: 1,
        text: secondPageText,
        attrs: expect.objectContaining({
          pageNumber: 2,
        }),
      }),
    ]);
  });

  it("rejects non-text PDFs with the scanned upload error", async () => {
    await expect(parsePdfToPageProjection(createBlankPdf(2))).rejects.toMatchObject({
      name: "PdfUploadValidationError",
      message: "Scanned PDFs are not supported yet; upload a text-based PDF instead",
    });
  });
});
