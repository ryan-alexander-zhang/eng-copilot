import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VocabularyPage from "@/app/(app)/vocabulary/page";
import { prisma } from "@/lib/db";

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
  redirect: vi.fn(),
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/auth", () => ({
  getRequiredSession: vi.fn().mockResolvedValue({
    user: {
      email: "owner@example.com",
      id: "user_123",
      name: "Owner",
    },
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    vocabularyEntry: {
      findMany: vi.fn(),
    },
    wordList: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/components/layout/owner-top-bar", () => ({
  OwnerTopBar: () => <div>Top bar</div>,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.wordList.findMany).mockResolvedValue([
    {
      id: "list_cet6",
      name: "CET6",
      slug: "cet6",
    },
    {
      id: "list_ielts",
      name: "IELTS",
      slug: "ielts",
    },
  ] as never);
  vi.mocked(prisma.vocabularyEntry.findMany).mockResolvedValue([
    {
      id: "entry_123",
      note: "Useful in academic writing",
      word: "observability",
      source: "manual",
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
      wordLists: [
        {
          wordList: {
            id: "list_cet6",
            name: "CET6",
            slug: "cet6",
          },
        },
        {
          wordList: {
            id: "list_ielts",
            name: "IELTS",
            slug: "ielts",
          },
        },
      ],
    },
  ] as never);
});

describe("VocabularyPage", () => {
  it("renders the redesigned vocabulary table, sidebar, and configured lookup links", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Vocabulary" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search vocabulary...")).toBeInTheDocument();
    expect(screen.getByText("Add word")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Note" })).toBeInTheDocument();
    expect(screen.getByText("Useful in academic writing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export" })).toHaveAttribute(
      "href",
      "/api/vocabulary",
    );
    const vocabularyLookupLink = screen.getByRole("link", {
      name: "Vocabulary.com lookup for observability",
    });
    expect(vocabularyLookupLink).toHaveAttribute(
      "href",
      "https://www.vocabulary.com/dictionary/observability",
    );
    expect(vocabularyLookupLink).toHaveAttribute("title", "Vocabulary.com");
    expect(vocabularyLookupLink.querySelector("img")).toHaveAttribute(
      "src",
      "/lookup-links/vocabulary.ico",
    );
    expect(screen.getByRole("link", { name: "Pronounce (UK) lookup for observability" })).toHaveAttribute(
      "href",
      "https://youglish.com/pronounce/observability/english/uk",
    );
    expect(screen.getByRole("button", { name: "Copy observability" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit observability" })).toBeInTheDocument();
    expect(screen.getAllByText("CET6").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IELTS").length).toBeGreaterThan(0);
  });

  it("keeps the vocabulary table card at content height when pagination is absent", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("table").closest("section")).toHaveClass("xl:self-start");
  });

  it("keeps the edit action area visible for dropdown panels", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("button", { name: "Edit observability" }).closest("td")).toHaveClass(
      "overflow-visible",
    );
    expect(screen.getByRole("table").closest("section")).not.toHaveClass("overflow-hidden");
  });

  it("uses the same outer page shell spacing as annotations", async () => {
    const { container } = render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(container.querySelector("main")).toHaveClass("min-h-screen", "bg-[#F8FAFC]");
    expect(container.querySelector("main")).not.toHaveClass("px-3", "py-3", "md:px-5", "md:py-5");
    expect(screen.getByText("Top bar").parentElement).toHaveClass(
      "border-[#E8EBF0]",
      "shadow-[0_12px_36px_rgba(15,23,42,0.06)]",
    );
  });
});
