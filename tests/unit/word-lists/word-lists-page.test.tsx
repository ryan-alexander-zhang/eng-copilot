import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WordListsPage from "@/app/(app)/word-lists/page";

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
    document: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "doc_1",
          rawMarkdown: "# Doc",
          title: "Document one",
          updatedAt: new Date("2026-04-25T00:00:00.000Z"),
        },
      ]),
    },
  },
}));

vi.mock("@/lib/word-lists/get-word-list-dashboard-data", () => ({
  getWordListDashboardData: vi.fn().mockResolvedValue({
    coverage: {
      description: "Great coverage across your uploaded library.",
      label: "High",
      progressClassName: "bg-[#56C271]",
      ratio: 0.8,
      toneClassName: "text-[#35A853]",
    },
    documentsCount: 1,
    documentsWithHighlightsCount: 1,
    lists: [
      {
        description: "Core vocabulary.",
        id: "cet4",
        isSelected: true,
        name: "CET4",
        slug: "cet4",
        syncedLabel: "Today",
        updatedAt: new Date("2026-04-25T00:00:00.000Z"),
        wordCount: 1200,
      },
    ],
    sampleMatchedWords: ["adaptability"],
    selectedCount: 1,
    totalSelectedWords: 1200,
  }),
}));

vi.mock("@/components/layout/document-upload-sidebar", () => ({
  DocumentUploadSidebar: () => <div>Upload</div>,
}));

vi.mock("@/components/layout/owner-documents-sidebar", () => ({
  OwnerDocumentsSidebar: () => <div>Documents sidebar</div>,
}));

vi.mock("@/components/layout/owner-top-bar", () => ({
  OwnerTopBar: () => <div>Top bar</div>,
}));

afterEach(() => {
  cleanup();
});

describe("WordListsPage", () => {
  it("binds Refresh to the word list sync form", async () => {
    render(await WordListsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute(
      "form",
      "word-lists-form",
    );
  });
});
