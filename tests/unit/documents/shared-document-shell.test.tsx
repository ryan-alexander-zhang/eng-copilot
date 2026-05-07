import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedDocumentShell } from "@/components/documents/shared-document-shell";

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
});

describe("SharedDocumentShell", () => {
  const annotation = {
    id: "annotation-1",
    color: "yellow",
    createdAt: new Date("2026-04-23T07:31:00.000Z"),
    endBlockKey: "paragraph:1",
    endOffset: 20,
    note: "Practical steps to build habits that stick and improve your daily life.",
    quote: "Start with one tiny action",
    startBlockKey: "paragraph:1",
    startOffset: 0,
    tags: ["mindset"],
    updatedAt: new Date("2026-04-23T07:31:00.000Z"),
  };

  const props = {
    activeWordLists: [
      {
        id: "word-list-cet4",
        entries: [{ term: "tiny" }],
        name: "CET4",
        slug: "cet4",
      },
    ],
    annotations: [annotation],
    blocks: [
      {
        blockKey: "paragraph:1",
        text: "Start with one tiny action, repeat it consistently, and let momentum improve your routine over time.",
      },
    ],
    createdAt: new Date("2026-04-23T00:00:00.000Z"),
    highlightMatches: [
      {
        blockKey: "paragraph:1",
        endOffset: 20,
        id: "highlight-1",
        startOffset: 11,
        term: "tiny",
      },
    ],
    originalName: "How to Build Good Habits.md",
    ownerInitials: "R",
    ownerLabel: "Ryan",
    readingMinutes: 4,
    title: "How to Build Good Habits",
    token: "share-token",
    updatedAt: new Date("2026-04-23T00:00:00.000Z"),
    wordCount: 860,
  };

  it("opens a read-only annotation dialog after selecting annotated text", () => {
    render(<SharedDocumentShell {...props} />);

    fireEvent.click(screen.getAllByTitle(/Annotations: annotation-1/)[0]!);
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Annotation")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Practical steps to build habits that stick and improve your daily life.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("How to Build Good Habits.md")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "View all annotations" })).toHaveAttribute(
      "href",
      "/shared/share-token/annotations",
    );
  });

  it("can open directly into the read-only annotation dialog from an initial annotation id", () => {
    render(<SharedDocumentShell {...props} initialSelectedAnnotationId="annotation-1" />);
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Annotation")).toBeInTheDocument();
    expect(within(dialog).getByText("Mindset")).toBeInTheDocument();
    expect(within(dialog).getByText("CET4")).toBeInTheDocument();
  });
});
