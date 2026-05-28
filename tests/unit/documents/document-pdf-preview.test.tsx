import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentPdfPreview } from "@/components/documents/document-pdf-preview";
import type { ProjectionBlock } from "@/lib/markdown/types";

const { loadPdfJsClientMock } = vi.hoisted(() => ({
  loadPdfJsClientMock: vi.fn(),
}));

vi.mock("@/lib/pdf/load-pdfjs-client", () => ({
  loadPdfJsClient: loadPdfJsClientMock,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  loadPdfJsClientMock.mockReset();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D);

  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: vi.fn(() => [
      {
        left: 20,
        top: 24,
        width: 42,
        height: 18,
      },
    ]),
  });
});

describe("DocumentPdfPreview", () => {
  it("rebuilds the runtime text layer into projected slice spans", async () => {
    const block = createPdfPageBlock("ability improves culture.");
    loadPdfJsClientMock.mockResolvedValue(
      createFakePdfJsClient([
        { str: "ability " },
        { str: "improves culture." },
      ]),
    );

    const { container } = render(
      <DocumentPdfPreview
        annotationSegmentsByBlock={{}}
        annotations={[]}
        blocks={[block]}
        highlightMatchesByBlock={{}}
        pdfSourceUrl="/api/documents/doc_pdf/pdf"
        searchMatchesByBlock={{}}
      />,
    );

    await waitFor(() => {
      const sliceSpans = container.querySelectorAll("[data-slice-start][data-slice-end]");

      expect(sliceSpans).toHaveLength(2);
    });

    expect(screen.getByText("Page 1")).toBeInTheDocument();

    const sliceSpans = [...container.querySelectorAll<HTMLElement>("[data-slice-start][data-slice-end]")];

    expect(sliceSpans.map((span) => span.textContent).join("")).toBe(block.text);
    expect(sliceSpans[0]).toHaveAttribute("data-block-key", block.blockKey);
    expect(sliceSpans[0]).toHaveAttribute("data-run-index", "0");
    expect(sliceSpans[1]).toHaveAttribute("data-run-index", "1");
  });

  it("replays persisted annotation rects and selects an annotation on click", async () => {
    const block = createPdfPageBlock("ability improves culture.");
    const onSelectAnnotation = vi.fn();
    loadPdfJsClientMock.mockResolvedValue(
      createFakePdfJsClient([
        { str: "ability " },
        { str: "improves culture." },
      ]),
    );

    const { container } = render(
      <DocumentPdfPreview
        annotationSegmentsByBlock={{}}
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: block.blockKey,
            startOffset: 0,
            endBlockKey: block.blockKey,
            endOffset: 7,
            anchorData: {
              kind: "pdf-page-text-v1",
              startPageNumber: 1,
              startRunIndex: 0,
              endPageNumber: 1,
              endRunIndex: 0,
              rects: [
                {
                  pageNumber: 1,
                  x: 12,
                  y: 16,
                  width: 48,
                  height: 18,
                },
              ],
            },
          },
        ]}
        blocks={[block]}
        highlightMatchesByBlock={{}}
        onSelectAnnotation={onSelectAnnotation}
        pdfSourceUrl="/api/documents/doc_pdf/pdf"
        searchMatchesByBlock={{}}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("[data-annotation-id='annotation-1']")).not.toBeNull();
    });

    const pageRoot = container.querySelector("[data-pdf-page-number='1']");

    if (!pageRoot) {
      throw new Error("Missing rendered PDF page root");
    }

    fireEvent.click(pageRoot, {
      clientX: 24,
      clientY: 20,
    });

    expect(onSelectAnnotation).toHaveBeenCalledWith("annotation-1");
  });
});

function createPdfPageBlock(text: string): ProjectionBlock {
  return {
    blockKey: "pdf-page:1:abcd1234",
    blockPath: "page:1",
    sortOrder: 0,
    kind: "pdf-page",
    selectable: true,
    text,
    attrs: {
      pageNumber: 1,
      width: 600,
      height: 800,
      rotation: 0,
    },
  };
}

function createFakePdfJsClient(
  items: Array<{
    str: string;
    hasEOL?: boolean;
  }>,
) {
  const page = {
    rotate: 0,
    getTextContent: vi.fn().mockResolvedValue({
      items,
      styles: {},
      lang: null,
    }),
    getViewport: vi.fn(({ scale }: { scale: number }) => ({
      width: 600 * scale,
      height: 800 * scale,
    })),
    render: vi.fn(() => ({
      promise: Promise.resolve(),
      cancel: vi.fn(),
    })),
  };

  class FakeTextLayer {
    container: HTMLDivElement;
    textDivs: HTMLElement[];

    constructor(input: {
      container: HTMLDivElement;
      textContentSource: { items: Array<{ str?: string }> };
    }) {
      this.container = input.container;
      this.textDivs = input.textContentSource.items.map((item) => {
        const div = document.createElement("div");
        div.textContent = item.str ?? "";
        return div;
      });
    }

    async render() {
      this.container.replaceChildren(...this.textDivs);
    }

    cancel() {}
  }

  return {
    getDocument: vi.fn(() => ({
      destroy: vi.fn(),
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(page),
      }),
    })),
    TextLayer: FakeTextLayer,
  };
}
