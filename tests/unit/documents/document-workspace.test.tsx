import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentWorkspace } from "@/components/documents/document-workspace";

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
  vi.restoreAllMocks();
});

describe("DocumentWorkspace", () => {
  it("switches the right sidebar into edit mode after selecting an annotation", () => {
    render(
      <DocumentWorkspace
        annotations={[
          {
            id: "annotation-1",
            color: "yellow",
            createdAt: new Date("2026-04-24T10:24:00.000Z"),
            endBlockKey: "paragraph:1",
            endOffset: 10,
            note: "This quote emphasizes that learning is valuable.",
            quote: "Learning is valuable.",
            startBlockKey: "paragraph:1",
            startOffset: 0,
            tags: [],
            updatedAt: new Date("2026-04-24T10:24:00.000Z"),
          },
        ]}
        blocks={[{ blockKey: "paragraph:1", text: "Learning is valuable." }]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        matchedWordCount={0}
        matchedWords={[]}
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

    expect(screen.getByText("Edit annotation")).toBeInTheDocument();
    expect(screen.getByText("Tip")).toBeInTheDocument();
    expect(screen.queryByText("Matched Words")).not.toBeInTheDocument();
    expect(screen.queryByText("Word Lists")).not.toBeInTheDocument();
  });

  it("can open directly in edit mode from an initial annotation id", () => {
    render(
      <DocumentWorkspace
        annotations={[
          {
            id: "annotation-1",
            color: "yellow",
            createdAt: new Date("2026-04-24T10:24:00.000Z"),
            endBlockKey: "paragraph:1",
            endOffset: 10,
            note: "This quote emphasizes that learning is valuable.",
            quote: "Learning is valuable.",
            startBlockKey: "paragraph:1",
            startOffset: 0,
            tags: [],
            updatedAt: new Date("2026-04-24T10:24:00.000Z"),
          },
        ]}
        blocks={[{ blockKey: "paragraph:1", text: "Learning is valuable." }]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
        enableShareAction={vi.fn().mockResolvedValue(undefined)}
        highlightMatches={[]}
        initialSelectedAnnotationId="annotation-1"
        matchedWordCount={0}
        matchedWords={[]}
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

    expect(screen.getByText("Edit annotation")).toBeInTheDocument();
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });
});
