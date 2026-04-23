import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentReader } from "@/components/documents/document-reader";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DocumentReader", () => {
  it("renders separate spans when highlights and annotations overlap", () => {
    render(
      <DocumentReader
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "paragraph:1",
            startOffset: 2,
            endBlockKey: "paragraph:1",
            endOffset: 5,
          },
        ]}
        blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
        highlightMatches={[
          {
            blockKey: "paragraph:1",
            startOffset: 1,
            endOffset: 4,
            term: "match",
          },
        ]}
      />,
    );

    const paragraph = screen
      .getByLabelText("Document reader")
      .querySelector('p[data-block-key="paragraph:1"]');
    const spans = paragraph?.querySelectorAll("span");

    expect(spans).toHaveLength(5);
    expect(spans?.[0]).toHaveTextContent("a");
    expect(spans?.[1]).toHaveTextContent("b");
    expect(spans?.[1]).toHaveStyle({ backgroundColor: "rgb(234, 243, 255)" });
    expect(spans?.[1]).toHaveAttribute("title", "Highlights: match");
    expect(spans?.[2]).toHaveTextContent("cd");
    expect(spans?.[2]).toHaveAttribute("data-annotation-ids", "annotation-1");
    expect(spans?.[2]).toHaveAttribute("title", "Highlights: match | Annotations: annotation-1");
    expect(spans?.[2]).toHaveStyle({ backgroundColor: "rgb(255, 243, 216)" });
    expect(spans?.[3]).toHaveTextContent("e");
    expect(spans?.[3]).toHaveAttribute("data-annotation-ids", "annotation-1");
    expect(spans?.[3]).toHaveAttribute("title", "Annotations: annotation-1");
    expect(spans?.[3]).toHaveStyle({ backgroundColor: "rgb(255, 243, 216)" });
  });

  it("ignores invalid highlight and annotation ranges while rendering", () => {
    render(
      <DocumentReader
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
      />,
    );

    const paragraph = screen.getByText("abcdef").closest("p");
    const spans = paragraph?.querySelectorAll("span");

    expect(spans).toHaveLength(1);
    expect(spans?.[0]).toHaveTextContent("abcdef");
    expect(spans?.[0]).not.toHaveAttribute("data-annotation-ids");
    expect(spans?.[0]).not.toHaveAttribute("title");
    expect(spans?.[0]).not.toHaveStyle({ backgroundColor: "rgb(254, 240, 138)" });
  });

  it("renders the non-paragraph block kinds", () => {
    render(
      <DocumentReader
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "code:1",
            startOffset: 0,
            endBlockKey: "code:1",
            endOffset: 5,
          },
        ]}
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
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "## Heading text" })).toBeInTheDocument();
    expect(screen.getByText("List text").closest("p")).toHaveTextContent("1. List text");
    expect(screen.getByText("Quote text").closest("blockquote")).toHaveTextContent("Quote text");
    expect(screen.getByTitle("Annotations: annotation-1").closest("code")).toHaveTextContent("const x = 1;");
  });

  it("opens the annotation context menu and dialog from a valid selection", () => {
    render(
      <DocumentReader
        annotations={[]}
        blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
      />,
    );

    const textSpan = screen.getByText("abcdef");
    const textNode = textSpan.firstChild;
    const range = document.createRange();

    range.setStart(textNode as Node, 1);
    range.setEnd(textNode as Node, 4);

    vi.spyOn(window, "getSelection").mockReturnValue({
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => range,
      toString: () => "bcd",
    } as unknown as Selection);

    fireEvent.contextMenu(textSpan);

    fireEvent.click(screen.getByRole("button", { name: /Add annotation/ }));

    expect(screen.getByText("New annotation")).toBeInTheDocument();
    expect(screen.getByText("“bcd”")).toBeInTheDocument();
  });
});
