import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentReader } from "@/components/documents/document-reader";

afterEach(() => {
  cleanup();
});

describe("DocumentReader", () => {
  it("renders separate spans when highlights and annotations overlap", () => {
    render(
      <DocumentReader
        blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
        highlightMatches={[
          {
            blockKey: "paragraph:1",
            startOffset: 1,
            endOffset: 4,
            term: "match",
          },
        ]}
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "paragraph:1",
            startOffset: 2,
            endBlockKey: "paragraph:1",
            endOffset: 5,
          },
        ]}
      />,
    );

    const paragraph = screen.getByLabelText("Document reader").querySelector("p");
    const spans = paragraph?.querySelectorAll("span");

    expect(spans).toHaveLength(5);
    expect(spans?.[0]).toHaveTextContent("a");
    expect(spans?.[0]).not.toHaveAttribute("data-annotation-ids");
    expect(spans?.[0]).not.toHaveAttribute("title");
    expect(spans?.[1]).toHaveTextContent("b");
    expect(spans?.[1]).toHaveStyle({ backgroundColor: "rgb(254, 240, 138)" });
    expect(spans?.[1]).toHaveAttribute("title", "Highlights: match");
    expect(spans?.[2]).toHaveTextContent("cd");
    expect(spans?.[2]).toHaveAttribute("data-annotation-ids", "annotation-1");
    expect(spans?.[2]).toHaveAttribute("title", "Highlights: match | Annotations: annotation-1");
    expect(spans?.[2]).toHaveStyle({
      backgroundColor: "rgb(254, 240, 138)",
      textDecoration: "underline",
    });
    expect(spans?.[3]).toHaveTextContent("e");
    expect(spans?.[3]).toHaveAttribute("data-annotation-ids", "annotation-1");
    expect(spans?.[3]).toHaveAttribute("title", "Annotations: annotation-1");
    expect(spans?.[3]).toHaveStyle({ textDecoration: "underline" });
    expect(spans?.[4]).toHaveTextContent("f");
    expect(spans?.[4]).not.toHaveAttribute("data-annotation-ids");
    expect(spans?.[4]).not.toHaveAttribute("title");
  });

  it("ignores invalid highlight and annotation ranges while rendering", () => {
    render(
      <DocumentReader
        blocks={[
          { blockKey: "paragraph:1", text: "abcdef" },
          { blockKey: "paragraph:2", text: "ghij" },
        ]}
        highlightMatches={[
          {
            blockKey: "paragraph:1",
            startOffset: 4,
            endOffset: 4,
            term: "empty",
          },
          {
            blockKey: "paragraph:1",
            startOffset: 0,
            endOffset: 99,
            term: "out-of-bounds",
          },
        ]}
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "paragraph:2",
            startOffset: 3,
            endBlockKey: "paragraph:1",
            endOffset: 1,
          },
          {
            id: "annotation-2",
            startBlockKey: "paragraph:1",
            startOffset: -1,
            endBlockKey: "paragraph:1",
            endOffset: 1,
          },
        ]}
      />,
    );

    const paragraph = screen.getByLabelText("Document reader").querySelector("p");
    const spans = paragraph?.querySelectorAll("span");

    expect(spans).toHaveLength(1);
    expect(spans?.[0]).toHaveTextContent("abcdef");
    expect(spans?.[0]).not.toHaveAttribute("data-annotation-ids");
    expect(spans?.[0]).not.toHaveAttribute("title");
    expect(spans?.[0]).not.toHaveStyle({ backgroundColor: "rgb(254, 240, 138)" });
    expect(spans?.[0]).not.toHaveStyle({ textDecoration: "underline" });
  });

  it("renders the non-paragraph block kinds", () => {
    render(
      <DocumentReader
        blocks={[
          { blockKey: "heading:1", kind: "heading", text: "Heading text" },
          { blockKey: "list-item:1", kind: "list-item", text: "List text" },
          { blockKey: "blockquote:1", kind: "blockquote", text: "Quote text" },
          { blockKey: "code:1", kind: "code", text: "const x = 1;" },
        ]}
        highlightMatches={[
          {
            blockKey: "heading:1",
            startOffset: 0,
            endOffset: 7,
            term: "Heading",
          },
        ]}
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "code:1",
            startOffset: 0,
            endBlockKey: "code:1",
            endOffset: 5,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Heading text" })).toBeInTheDocument();
    expect(screen.getByText("List text").closest("p")).toHaveTextContent("• List text");
    expect(screen.getByText("Quote text").closest("blockquote")).toHaveTextContent("Quote text");
    expect(screen.getByTitle("Annotations: annotation-1").closest("code")).toHaveTextContent("const x = 1;");
  });
});
