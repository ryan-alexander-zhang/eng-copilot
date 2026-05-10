import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MatchedWordsPage from "@/app/(app)/documents/[documentId]/matched-words/page";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnerDocument } from "@/lib/documents/get-owner-document";

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

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getRequiredSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wordList: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/documents/get-owner-document", () => ({
  getOwnerDocument: vi.fn(),
}));

vi.mock("@/components/layout/owner-top-bar", () => ({
  OwnerTopBar: () => <div>Owner top bar</div>,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MatchedWordsPage", () => {
  it("renders all matched words for the owner document", async () => {
    vi.mocked(getRequiredSession).mockResolvedValue({
      user: {
        id: "owner_123",
        name: "Ryan",
      },
    } as Awaited<ReturnType<typeof getRequiredSession>>);
    vi.mocked(getOwnerDocument).mockResolvedValue({
      id: "doc_1",
      title: "Learning",
      originalName: "Learning.md",
      rawMarkdown: "# Learning",
      createdAt: new Date("2026-04-20T00:00:00.000Z"),
      updatedAt: new Date("2026-04-20T00:00:00.000Z"),
      share: null,
      activeLists: [
        {
          wordList: {
            id: "cet4",
            slug: "cet4",
            name: "CET4",
          },
        },
      ],
      blocks: [],
      highlightMatches: [
        {
          id: "match-1",
          blockKey: "paragraph:1",
          startOffset: 0,
          endOffset: 8,
          term: "valuable",
        },
        {
          id: "match-2",
          blockKey: "paragraph:2",
          startOffset: 0,
          endOffset: 8,
          term: "valuable",
        },
      ],
      annotations: [],
    });
    vi.mocked(prisma.wordList.findMany).mockResolvedValue([
      {
        name: "CET4",
        entries: [{ term: "valuable" }],
      },
    ]);

    render(
      await MatchedWordsPage({
        params: Promise.resolve({ documentId: "doc_1" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "Matched words" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to document/ })).toHaveAttribute(
      "href",
      "/documents/doc_1",
    );
    expect(screen.getByText("valuable")).toBeInTheDocument();
    expect(screen.getByText("CET4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
