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
      upsert: vi.fn(),
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
  vi.mocked(prisma.wordList.upsert).mockResolvedValue({
    id: "list_default",
    name: "Default Word List",
    slug: "user-user_123-default-word-list",
  } as never);
  vi.mocked(prisma.wordList.findMany).mockResolvedValue([
    {
      id: "list_default",
      name: "Default Word List",
      slug: "user-user_123-default-word-list",
    },
    {
      id: "list_academic_review",
      name: "Academic Review",
      slug: "user-user_123-academic-review",
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
            id: "list_default",
            name: "Default Word List",
            slug: "user-user_123-default-word-list",
          },
        },
        {
          wordList: {
            id: "list_academic_review",
            name: "Academic Review",
            slug: "user-user_123-academic-review",
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
    expect(screen.getByText("New list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy observability" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit observability" })).toBeInTheDocument();
    expect(screen.getAllByText("Default Word List").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Academic Review").length).toBeGreaterThan(0);
    expect(vocabularyLookupLink.parentElement).toHaveClass("flex-nowrap");
  });

  it("keeps the vocabulary table card at content height when pagination is absent", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("table").closest("section")).toHaveClass("xl:self-start");
  });

  it("uses the same table surface treatment as documents while keeping action anchors intact", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("button", { name: "Edit observability" }).closest("td")).toHaveClass(
      "relative",
    );
    expect(screen.getByRole("table").closest("section")).toHaveClass("overflow-hidden");
  });

  it("uses the shared app shell and frame", async () => {
    const { container } = render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(container.querySelector("main")).toHaveClass("app-shell");
    expect(container.querySelector("main > div")).toHaveClass("app-frame");
  });

  it("auto-submits the filter form when sort changes", async () => {
    let submittedSort: FormDataEntryValue | null = null;
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(function (this: HTMLFormElement) {
        submittedSort = new FormData(this).get("sort");
      });

    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));
    fireEvent.click(screen.getByRole("option", { name: "Oldest first" }));

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(submittedSort).toBe("oldest");
  });

  it("opens the new list popover when its trigger is clicked", async () => {
    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    fireEvent.click(screen.getByRole("button", { name: "New list" }));

    expect(screen.getByPlaceholderText("Word list name")).toBeInTheDocument();
  });

  it("shows 15 vocabulary entries on the first page by default", async () => {
    vi.mocked(prisma.vocabularyEntry.findMany).mockResolvedValue(
      Array.from({ length: 16 }, (_, index) => ({
        id: `entry_${index + 1}`,
        note: `Note ${index + 1}`,
        word: `word-${index + 1}`,
        source: "manual",
        createdAt: new Date(`2026-05-${String((index % 9) + 1).padStart(2, "0")}T00:00:00.000Z`),
        wordLists: [],
      })) as never,
    );

    render(await VocabularyPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getAllByLabelText(/^Select word-/i)).toHaveLength(15);
    expect(screen.getByText("1-15 of 16 words")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2" })).toBeInTheDocument();
  });
});
