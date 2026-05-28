import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("DocumentWorkspace", () => {
  it("links workspace drill-down actions to the document-specific destinations", () => {
    render(
      <DocumentWorkspace
        annotations={[]}
        annotationIndexHref="/annotations?document=doc_1"
        blocks={[]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        documentId="doc_1"
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        matchedWordCount={0}
        matchedWords={[]}
        matchedWordsHref="/documents/doc_1/matched-words"
        rawMarkdown="# Title"
        readingMinutes={1}
        revokeShareAction={vi.fn().mockResolvedValue(undefined)}
        share={null}
        title="Title"
        updateAction={vi.fn().mockResolvedValue(undefined)}
        updatedLabel="Today at 10:24 AM"
        wordCount={1}
        wordLists={[]}
      />,
    );

    expect(screen.getByRole("link", { name: "View all annotations" })).toHaveAttribute(
      "href",
      "/annotations?document=doc_1",
    );
    expect(screen.getByRole("link", { name: "View all matched words →" })).toHaveAttribute(
      "href",
      "/documents/doc_1/matched-words",
    );
  });

  it("shows search result count and next-result navigation in the workspace", () => {
    const rawMarkdown = "Learning is valuable.\n\nValuable habits compound.";

    render(
      <DocumentWorkspace
        annotations={[]}
        annotationIndexHref="/annotations?document=doc_1"
        blocks={parseMarkdownToBlocks(rawMarkdown)}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        documentId="doc_1"
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        matchedWordCount={0}
        matchedWords={[]}
        matchedWordsHref="/documents/doc_1/matched-words"
        rawMarkdown={rawMarkdown}
        readingMinutes={1}
        revokeShareAction={vi.fn().mockResolvedValue(undefined)}
        share={null}
        title="Learning"
        updateAction={vi.fn().mockResolvedValue(undefined)}
        updatedLabel="Today at 10:24 AM"
        wordCount={6}
        wordLists={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search in document..."), {
      target: { value: "valuable" },
    });

    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next search result" }));

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("opens the annotation editor as a dialog without replacing the right sidebar", () => {
    const rawMarkdown = "Learning is valuable.";
    const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);

    if (!paragraphBlock) {
      throw new Error("Missing workspace paragraph block");
    }

    render(
      <DocumentWorkspace
        annotations={[
          {
            id: "annotation-1",
            color: "yellow",
            createdAt: new Date("2026-04-24T10:24:00.000Z"),
            endBlockKey: paragraphBlock.blockKey,
            endOffset: 10,
            note: "This quote emphasizes that learning is valuable.",
            quote: "Learning is valuable.",
            startBlockKey: paragraphBlock.blockKey,
            startOffset: 0,
            tags: [],
            updatedAt: new Date("2026-04-24T10:24:00.000Z"),
          },
        ]}
        annotationIndexHref="/annotations?document=doc_1"
        blocks={[paragraphBlock]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        documentId="doc_1"
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        matchedWordCount={0}
        matchedWords={[]}
        matchedWordsHref="/documents/doc_1/matched-words"
        rawMarkdown={rawMarkdown}
        readingMinutes={1}
        revokeShareAction={vi.fn().mockResolvedValue(undefined)}
        share={null}
        title="Test document"
        updateAction={vi.fn().mockResolvedValue(undefined)}
        updatedLabel="Today at 10:24 AM"
        wordCount={3}
        wordLists={[
          {
            id: "cet4",
            isSelected: true,
            name: "CET4",
          },
        ]}
      />,
    );

    expect(screen.getByText("Word Lists")).toBeInTheDocument();
    expect(screen.getByText("Matched Words")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /This quote emphasizes/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Edit annotation")).toBeInTheDocument();
    expect(screen.getByText("Tip")).toBeInTheDocument();
    expect(screen.getByText("Matched Words")).toBeInTheDocument();
    expect(screen.getByText("Word Lists")).toBeInTheDocument();
    expect(screen.queryByText("All annotations")).not.toBeInTheDocument();
  });

  it("can open directly in the annotation editor dialog from an initial annotation id", () => {
    const rawMarkdown = "Learning is valuable.";
    const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);

    if (!paragraphBlock) {
      throw new Error("Missing workspace paragraph block");
    }

    render(
      <DocumentWorkspace
        annotations={[
          {
            id: "annotation-1",
            color: "yellow",
            createdAt: new Date("2026-04-24T10:24:00.000Z"),
            endBlockKey: paragraphBlock.blockKey,
            endOffset: 10,
            note: "This quote emphasizes that learning is valuable.",
            quote: "Learning is valuable.",
            startBlockKey: paragraphBlock.blockKey,
            startOffset: 0,
            tags: [],
            updatedAt: new Date("2026-04-24T10:24:00.000Z"),
          },
        ]}
        annotationIndexHref="/annotations?document=doc_1"
        blocks={[paragraphBlock]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        documentId="doc_1"
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        initialSelectedAnnotationId="annotation-1"
        matchedWordCount={0}
        matchedWords={[]}
        matchedWordsHref="/documents/doc_1/matched-words"
        rawMarkdown={rawMarkdown}
        readingMinutes={1}
        revokeShareAction={vi.fn().mockResolvedValue(undefined)}
        share={null}
        title="Test document"
        updateAction={vi.fn().mockResolvedValue(undefined)}
        updatedLabel="Today at 10:24 AM"
        wordCount={3}
        wordLists={[]}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Edit annotation")).toBeInTheDocument();
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("hides the tip after dismissing it and persists the dismissal", () => {
    const rawMarkdown = "Learning is valuable.";
    const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);

    if (!paragraphBlock) {
      throw new Error("Missing workspace paragraph block");
    }

    render(
      <DocumentWorkspace
        annotations={[
          {
            id: "annotation-1",
            color: "yellow",
            createdAt: new Date("2026-04-24T10:24:00.000Z"),
            endBlockKey: paragraphBlock.blockKey,
            endOffset: 10,
            note: "Important note.",
            quote: "Learning is valuable.",
            startBlockKey: paragraphBlock.blockKey,
            startOffset: 0,
            tags: [],
            updatedAt: new Date("2026-04-24T10:24:00.000Z"),
          },
        ]}
        annotationIndexHref="/annotations?document=doc_1"
        blocks={[paragraphBlock]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        documentId="doc_1"
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        initialSelectedAnnotationId="annotation-1"
        matchedWordCount={0}
        matchedWords={[]}
        matchedWordsHref="/documents/doc_1/matched-words"
        rawMarkdown={rawMarkdown}
        readingMinutes={1}
        revokeShareAction={vi.fn().mockResolvedValue(undefined)}
        share={null}
        title="Learning"
        updateAction={vi.fn().mockResolvedValue(undefined)}
        updatedLabel="Today at 10:24 AM"
        wordCount={3}
        wordLists={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Tip")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("document-workspace-tip-dismissed")).toBe("1");
  });

  it("renders the supported markdown toolbar controls for annotation notes", () => {
    renderWorkspaceInEditMode();

    const noteField = screen.getByLabelText("Note");

    expect(within(noteField.parentElement!).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulleted list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Numbered list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert link" })).toBeInTheDocument();
  });

  it.each([
    {
      buttonName: "Bold",
      expectedValue: "Focus **term**",
      initialNote: "Focus term",
      selectedText: "term",
    },
    {
      buttonName: "Italic",
      expectedValue: "Focus *term*",
      initialNote: "Focus term",
      selectedText: "term",
    },
    {
      buttonName: "Bulleted list",
      expectedValue: "- term\n- next",
      initialNote: "term\nnext",
      selectedText: "term\nnext",
    },
    {
      buttonName: "Numbered list",
      expectedValue: "1. term\n2. next",
      initialNote: "term\nnext",
      selectedText: "term\nnext",
    },
    {
      buttonName: "Insert link",
      expectedValue: "Focus [term](https://)",
      initialNote: "Focus term",
      selectedText: "term",
    },
  ])("applies $buttonName formatting to the note textarea", ({ buttonName, expectedValue, initialNote, selectedText }) => {
    renderWorkspaceInEditMode({ note: initialNote });

    const noteField = screen.getByLabelText("Note") as HTMLTextAreaElement;

    selectText(noteField, selectedText);
    fireEvent.click(screen.getByRole("button", { name: buttonName }));

    expect(noteField.value).toBe(expectedValue);
  });

  it("submits the formatted note value exactly as edited", async () => {
    const updateAction = vi.fn().mockResolvedValue(undefined);

    renderWorkspaceInEditMode({
      note: "Focus term",
      updateAction,
    });

    const noteField = screen.getByLabelText("Note") as HTMLTextAreaElement;

    selectText(noteField, "term");
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    fireEvent.submit(screen.getByRole("button", { name: "Save annotation" }).closest("form")!);

    await waitFor(() => {
      expect(updateAction).toHaveBeenCalledTimes(1);
    });

    expect(updateAction.mock.calls[0]?.[0]).toBeInstanceOf(FormData);
    expect(updateAction.mock.calls[0]?.[0].get("note")).toBe("Focus **term**");
  });

  it("shows a saved toast and closes the editor after saving an annotation", async () => {
    const updateAction = vi.fn().mockResolvedValue(undefined);

    renderWorkspaceInEditMode({
      updateAction,
    });

    fireEvent.submit(screen.getByRole("button", { name: "Save annotation" }).closest("form")!);

    await waitFor(() => {
      expect(updateAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("status")).toHaveTextContent("Annotation saved.");
  });

  it("requires confirmation before deleting an annotation", async () => {
    const deleteAction = vi.fn().mockResolvedValue(undefined);
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWorkspaceInEditMode({
      deleteAction,
    });

    fireEvent.submit(screen.getByRole("button", { name: "Delete annotation" }).closest("form")!);

    expect(confirmMock).toHaveBeenCalledWith(
      "Delete this annotation? This action cannot be undone.",
    );
    expect(deleteAction).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

function renderWorkspaceInEditMode(input?: {
  deleteAction?: (formData: FormData) => Promise<void>;
  note?: string;
  updateAction?: (formData: FormData) => Promise<void>;
}) {
  const rawMarkdown = "Learning is valuable.";
  const [paragraphBlock] = parseMarkdownToBlocks(rawMarkdown);

  if (!paragraphBlock) {
    throw new Error("Missing workspace paragraph block");
  }

  render(
    <DocumentWorkspace
      annotations={[
        {
          id: "annotation-1",
          color: "yellow",
          createdAt: new Date("2026-04-24T10:24:00.000Z"),
          endBlockKey: paragraphBlock.blockKey,
          endOffset: 10,
          note: input?.note ?? "Important note.",
          quote: "Learning is valuable.",
          startBlockKey: paragraphBlock.blockKey,
          startOffset: 0,
          tags: [],
          updatedAt: new Date("2026-04-24T10:24:00.000Z"),
        },
      ]}
      annotationIndexHref="/annotations?document=doc_1"
      blocks={[paragraphBlock]}
      createAction={vi.fn().mockResolvedValue(undefined)}
      deleteAction={input?.deleteAction ?? vi.fn().mockResolvedValue(undefined)}
      documentId="doc_1"
      enableShareAction={vi.fn().mockResolvedValue(undefined)}
      highlightMatches={[]}
      initialSelectedAnnotationId="annotation-1"
      matchedWordCount={0}
      matchedWords={[]}
      matchedWordsHref="/documents/doc_1/matched-words"
      rawMarkdown={rawMarkdown}
      readingMinutes={1}
      revokeShareAction={vi.fn().mockResolvedValue(undefined)}
      share={null}
      title="Learning"
      updateAction={input?.updateAction ?? vi.fn().mockResolvedValue(undefined)}
      updatedLabel="Today at 10:24 AM"
      wordCount={3}
      wordLists={[]}
    />,
  );
}

function selectText(noteField: HTMLTextAreaElement, selectedText: string) {
  const selectionStart = noteField.value.indexOf(selectedText);

  if (selectionStart < 0) {
    throw new Error(`Could not find "${selectedText}" in "${noteField.value}"`);
  }

  noteField.focus();
  noteField.setSelectionRange(selectionStart, selectionStart + selectedText.length);
}
