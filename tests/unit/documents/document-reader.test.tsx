import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentReader } from "@/components/documents/document-reader";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DocumentReader", () => {
  it("renders active search hits in the reader", () => {
    render(
      <DocumentReader
        activeSearchMatchId="paragraph:1:12-20"
        annotations={[]}
        blocks={[{ blockKey: "paragraph:1", text: "Learning is valuable." }]}
        highlightMatches={[]}
        searchMatches={[
          {
            id: "paragraph:1:12-20",
            blockKey: "paragraph:1",
            startOffset: 12,
            endOffset: 20,
            text: "valuable",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("search-hit-active")).toBeInTheDocument();
  });

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
        searchMatches={[]}
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
        searchMatches={[]}
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
        searchMatches={[]}
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
        searchMatches={[]}
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

  it("copies selected text from the context menu", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <DocumentReader
        annotations={[]}
        blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        searchMatches={[]}
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
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("bcd");
    });
  });

  it("opens a new tab for web search", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    render(
      <DocumentReader
        annotations={[]}
        blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        searchMatches={[]}
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
    fireEvent.click(screen.getByRole("button", { name: "Search the web" }));

    expect(open).toHaveBeenCalledWith(
      "https://www.google.com/search?q=bcd",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("adds the selected text to vocabulary from the context menu", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    render(
      <DocumentReader
        annotations={[]}
        blocks={[{ blockKey: "paragraph:1", text: "abcdef" }]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        searchMatches={[]}
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
    fireEvent.click(screen.getByRole("button", { name: "Add to vocabulary" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/vocabulary", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          word: "bcd",
        }),
      });
    });
  });

  it("opens a raw markdown dialog from the reader footer", () => {
    render(
      <DocumentReader
        annotations={[]}
        blocks={[{ blockKey: "paragraph:1", text: "Paragraph" }]}
        footer={{
          readingMinutes: 1,
          updatedLabel: "Today at 10:24 AM",
          wordCount: 1,
        }}
        highlightMatches={[]}
        rawMarkdown="# Title"
        searchMatches={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Open raw Markdown/ }));

    expect(screen.getByRole("dialog")).toHaveTextContent("# Title");
  });

  it("can strip the markdown title without rendering a duplicate page heading", () => {
    render(
      <DocumentReader
        annotations={[]}
        blocks={[
          { blockKey: "heading:1", kind: "heading", text: "The Value of Lifelong Learning" },
          { blockKey: "paragraph:1", text: "A paragraph after the title." },
        ]}
        highlightMatches={[]}
        searchMatches={[]}
        showTitle={false}
        title="The Value of Lifelong Learning"
      />,
    );

    expect(
      screen.queryByRole("heading", { level: 1, name: "The Value of Lifelong Learning" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "## The Value of Lifelong Learning" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("A paragraph after the title.")).toBeInTheDocument();
  });

  it("renders semantic markdown when raw markdown is provided", () => {
    const rawMarkdown = "# Semantic Title\n\nThis has **bold** text and a [link](https://example.com).\n\n- alpha\n  - beta\n\n> gamma";

    render(
      <DocumentReader
        annotations={[]}
        blocks={parseMarkdownToBlocks(rawMarkdown)}
        highlightMatches={[]}
        rawMarkdown={rawMarkdown}
        searchMatches={[]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Semantic Title" })).toBeInTheDocument();
    expect(screen.getByText("bold").closest("strong")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByText("alpha").closest("li")).toBeInTheDocument();
    expect(screen.getByText("gamma").closest("blockquote")).toBeInTheDocument();
  });

  it("keeps annotation slicing across inline markdown boundaries", () => {
    const rawMarkdown = "ab**cd**ef";
    const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);

    render(
      <DocumentReader
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: paragraphBlock!.blockKey,
            startOffset: 2,
            endBlockKey: paragraphBlock!.blockKey,
            endOffset: 5,
          },
        ]}
        blocks={[paragraphBlock!]}
        highlightMatches={[
          {
            blockKey: paragraphBlock!.blockKey,
            startOffset: 1,
            endOffset: 4,
            term: "match",
          },
        ]}
        rawMarkdown={rawMarkdown}
        searchMatches={[]}
      />,
    );

    expect(screen.getByTitle("Highlights: match | Annotations: annotation-1")).toHaveTextContent(
      "cd",
    );
    expect(screen.getByTitle("Annotations: annotation-1")).toHaveTextContent("e");
    expect(screen.getByText("cd").closest("strong")).toBeInTheDocument();
  });

  it("renders mermaid fences as preview-only blocks", () => {
    const rawMarkdown = "```mermaid\ngraph TD;\nA-->B;\n```";

    render(
      <DocumentReader
        annotations={[]}
        blocks={parseMarkdownToBlocks(rawMarkdown)}
        highlightMatches={[]}
        rawMarkdown={rawMarkdown}
        searchMatches={[]}
      />,
    );

    expect(screen.getByText("Mermaid preview is not enabled yet.")).toBeInTheDocument();
    expect(screen.getByText(/graph TD;\s*A-->B;/)).toBeInTheDocument();
  });

  it("prefers annotation selection over link navigation inside semantic markdown", () => {
    const rawMarkdown = "[alpha](https://example.com)";
    const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);
    const onSelectAnnotation = vi.fn();

    render(
      <DocumentReader
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: paragraphBlock!.blockKey,
            startOffset: 0,
            endBlockKey: paragraphBlock!.blockKey,
            endOffset: 5,
          },
        ]}
        blocks={[paragraphBlock!]}
        highlightMatches={[]}
        onSelectAnnotation={onSelectAnnotation}
        rawMarkdown={rawMarkdown}
        searchMatches={[]}
      />,
    );

    fireEvent.click(screen.getByTitle("Annotations: annotation-1"));

    expect(onSelectAnnotation).toHaveBeenCalledWith("annotation-1");
  });

  it("keeps offsets stable after inline images are removed from visible text projection", () => {
    const rawMarkdown = "alpha ![ignored alt](x.png) beta";
    const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);

    render(
      <DocumentReader
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: paragraphBlock!.blockKey,
            startOffset: 7,
            endBlockKey: paragraphBlock!.blockKey,
            endOffset: 11,
          },
        ]}
        blocks={[paragraphBlock!]}
        highlightMatches={[
          {
            blockKey: paragraphBlock!.blockKey,
            startOffset: 7,
            endOffset: 11,
            term: "beta",
          },
        ]}
        rawMarkdown={rawMarkdown}
        searchMatches={[]}
      />,
    );

    expect(screen.getByTitle("Highlights: beta | Annotations: annotation-1")).toHaveTextContent(
      "beta",
    );
  });
});
