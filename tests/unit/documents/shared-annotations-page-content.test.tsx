import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedAnnotationsPageContent } from "@/components/documents/shared-annotations-page-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/shared/share-token/annotations",
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

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

describe("SharedAnnotationsPageContent", () => {
  it("renders a read-only annotation index with links back to the shared document", () => {
    render(
      <SharedAnnotationsPageContent
        activeWordLists={[
          {
            id: "word-list-cet4",
            entries: [{ term: "tiny" }],
            name: "CET4",
            slug: "cet4",
          },
        ]}
        annotations={[
          {
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
          },
        ]}
        blocks={[
          {
            blockKey: "paragraph:1",
            text: "Start with one tiny action, repeat it consistently, and let momentum improve your routine over time.",
          },
        ]}
        highlightMatches={[
          {
            blockKey: "paragraph:1",
            endOffset: 20,
            id: "highlight-1",
            startOffset: 11,
            term: "tiny",
          },
        ]}
        originalName="How to Build Good Habits.md"
        readingMinutes={4}
        sharedBy="Ryan"
        sharedOn={new Date("2026-04-23T00:00:00.000Z")}
        title="How to Build Good Habits"
        token="share-token"
        totalWords={860}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Annotations in this document" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to document" })).toHaveAttribute(
      "href",
      "/shared/share-token",
    );
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/shared/share-token?annotation=annotation-1",
    );
    expect(screen.getByText("Total annotations")).toBeInTheDocument();
    const summarySection = screen.getByText("Total annotations").closest("section");
    expect(summarySection).not.toBeNull();
    expect(within(summarySection as HTMLElement).getAllByText("1")).toHaveLength(2);
  });
});
