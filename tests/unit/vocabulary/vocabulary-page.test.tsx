import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  it("renders vocabulary controls and configured lookup links", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Vocabulary" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search vocabulary...")).toBeInTheDocument();
    expect(screen.getByText("Add word")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export" })).toHaveAttribute(
      "href",
      "/api/vocabulary",
    );
    fireEvent.click(screen.getByText("Open links"));
    expect(screen.getByRole("link", { name: "Vocabulary.com" })).toHaveAttribute(
      "href",
      "https://www.vocabulary.com/dictionary/observability",
    );
    expect(screen.getByRole("link", { name: "Pronounce (UK)" })).toHaveAttribute(
      "href",
      "https://youglish.com/pronounce/observability/english/uk",
    );
    expect(screen.getAllByText("CET6").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IELTS").length).toBeGreaterThan(0);
  });

  it("keeps secondary add and import controls out of the header until opened", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add a word...")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Vocabulary JSON file")).not.toBeInTheDocument();
  });
});
