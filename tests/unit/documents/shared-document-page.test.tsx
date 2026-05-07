import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SharedDocumentPage from "@/app/shared/[token]/page";
import { prisma } from "@/lib/db";
import { getSharedDocument } from "@/lib/documents/get-shared-document";

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
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  UnauthenticatedError: class extends Error {},
  getRequiredSession: vi.fn().mockResolvedValue({
    user: {
      id: "viewer_123",
    },
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    userWordListPreference: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/documents/get-shared-document", () => ({
  getSharedDocument: vi.fn(),
}));

vi.mock("@/components/documents/document-reader", () => ({
  DocumentReader: () => <div aria-label="Document reader">Document reader</div>,
}));

vi.mock("@/components/documents/annotation-panel", () => ({
  AnnotationPanel: () => <div>Annotations</div>,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SharedDocumentPage", () => {
  it("places document metadata before the read-only callout", async () => {
    vi.mocked(prisma.userWordListPreference.findMany).mockResolvedValue([]);
    vi.mocked(getSharedDocument).mockResolvedValue({
      activeLists: [],
      annotations: [],
      blocks: [{ blockKey: "paragraph:1", text: "Small changes compound over time." }],
      createdAt: new Date("2026-04-20T00:00:00.000Z"),
      highlightMatches: [],
      owner: {
        email: "ryan@example.com",
        name: "Ryan",
      },
      originalName: "The Power of Small Changes.md",
      rawMarkdown: "# The Power of Small Changes\n\nSmall changes compound over time.",
      title: "The Power of Small Changes",
      updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    });

    render(
      await SharedDocumentPage({
        params: Promise.resolve({ token: "share-token" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const createdLabel = screen.getByText("Created");
    const lastEditedLabel = screen.getByText("Last edited");
    const wordsLabel = screen.getByText("Words");
    const readingTimeLabel = screen.getByText("Reading time");
    const callout = screen.getByText("This is a read-only shared document.");

    expect(createdLabel.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(lastEditedLabel.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(wordsLabel.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(readingTimeLabel.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });
});
