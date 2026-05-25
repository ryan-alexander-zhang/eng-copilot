import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentMarkdownPreview } from "@/components/documents/document-markdown-preview";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";

afterEach(() => {
  cleanup();
});

describe("DocumentMarkdownPreview", () => {
  it("renders semantic table cells through projected inline spans", () => {
    const rawMarkdown = [
      "| Topic | Note |",
      "| --- | --- |",
      "| alpha | *beta* and `gamma` |",
    ].join("\n");
    const blocks = parseMarkdownToBlocks(rawMarkdown);
    const noteCellBlock = blocks.find(
      (block) => block.kind === "table-cell" && block.text === "beta and gamma",
    );

    if (!noteCellBlock) {
      throw new Error("Missing projected note cell block");
    }

    render(
      <DocumentMarkdownPreview
        annotationSegmentsByBlock={{}}
        blocks={blocks}
        highlightMatchesByBlock={{}}
        rawMarkdown={rawMarkdown}
        searchMatchesByBlock={{}}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("beta").closest("em")).toBeInTheDocument();
    expect(screen.getByText("gamma").closest("code")).toBeInTheDocument();
    expect(screen.getByText("beta").closest("span[data-slice-start]")).toHaveAttribute(
      "data-block-key",
      noteCellBlock.blockKey,
    );
  });

  it("renders images and mermaid blocks without disturbing nearby projected text", () => {
    const rawMarkdown = [
      "alpha ![ignored alt](x.png) beta",
      "",
      "```mermaid",
      "graph TD;",
      "A-->B;",
      "```",
    ].join("\n");
    const blocks = parseMarkdownToBlocks(rawMarkdown);
    const paragraphBlock = blocks.find((block) => block.kind === "paragraph");

    if (!paragraphBlock) {
      throw new Error("Missing projected paragraph block");
    }

    const betaStart = paragraphBlock.text.indexOf("beta");

    if (betaStart < 0) {
      throw new Error("Missing projected beta text");
    }

    render(
      <DocumentMarkdownPreview
        annotationSegmentsByBlock={{
          [paragraphBlock.blockKey]: [
            {
              annotationId: "annotation-1",
              startOffset: betaStart,
              endOffset: betaStart + 4,
            },
          ],
        }}
        blocks={blocks}
        highlightMatchesByBlock={{
          [paragraphBlock.blockKey]: [
            {
              blockKey: paragraphBlock.blockKey,
              startOffset: betaStart,
              endOffset: betaStart + 4,
              term: "beta",
            },
          ],
        }}
        rawMarkdown={rawMarkdown}
        searchMatchesByBlock={{}}
      />,
    );

    expect(screen.getByAltText("ignored alt")).toBeInTheDocument();
    expect(screen.getByTitle("Highlights: beta | Annotations: annotation-1")).toHaveTextContent(
      "beta",
    );
    expect(screen.getByText("Mermaid preview is not enabled yet.")).toBeInTheDocument();
  });

  it("does not render html comments from raw markdown", () => {
    const rawMarkdown = [
      "# Title",
      "",
      "Visible paragraph.",
      "",
      "<!-- learning learning learning -->",
    ].join("\n");

    render(
      <DocumentMarkdownPreview
        annotationSegmentsByBlock={{}}
        blocks={parseMarkdownToBlocks(rawMarkdown)}
        highlightMatchesByBlock={{}}
        rawMarkdown={rawMarkdown}
        searchMatchesByBlock={{}}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Visible paragraph.")).toBeInTheDocument();
    expect(screen.queryByText(/learning learning learning/)).not.toBeInTheDocument();
  });
});
