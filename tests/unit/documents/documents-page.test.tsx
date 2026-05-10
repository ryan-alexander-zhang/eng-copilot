import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "@/app/(app)/documents/page";
import { prisma } from "@/lib/db";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/documents/get-library-sidebar-data", () => ({
  getLibrarySidebarData: vi.fn().mockResolvedValue({
    counts: {
      documents: 2,
      readOnlyLinks: 0,
      sharedWithMe: 0,
      trash: 0,
      vocabulary: 0,
      wordLists: 0,
    },
    storage: {
      progress: 0.1,
      totalLabel: "10 GB",
      usedLabel: "1 MB",
    },
  }),
}));

vi.mock("@/components/documents/document-table-row-actions", () => ({
  DocumentTableRowActions: () => <td>Actions</td>,
}));

vi.mock("@/components/layout/library-page-shell", () => ({
  LibraryPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DocumentsPage", () => {
  it("renders annotation totals and row counts from document data", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([
      {
        _count: {
          annotations: 1,
        },
        activeLists: [],
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        id: "doc_1",
        originalName: "focus.md",
        rawMarkdown: "# Focus\n\nOne sharp note.",
        share: null,
        title: "The Art of Focus",
        updatedAt: new Date("2026-05-02T00:00:00.000Z"),
      },
      {
        _count: {
          annotations: 2,
        },
        activeLists: [],
        createdAt: new Date("2026-05-03T00:00:00.000Z"),
        id: "doc_2",
        originalName: "communication.md",
        rawMarkdown: "# Communication\n\nSecond note.",
        share: null,
        title: "Effective Communication",
        updatedAt: new Date("2026-05-04T00:00:00.000Z"),
      },
    ]);

    render(await DocumentsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("3")).toBeInTheDocument();

    const focusRow = screen.getByRole("link", { name: /The Art of Focus\.md/i }).closest("tr");

    expect(focusRow).not.toBeNull();
    expect(within(focusRow as HTMLTableRowElement).getByText("1")).toBeInTheDocument();
  });

  it("does not render a dead filter button", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([
      {
        _count: {
          annotations: 0,
        },
        activeLists: [],
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        id: "doc_1",
        originalName: "focus.md",
        rawMarkdown: "# Focus\n\nOne sharp note.",
        share: null,
        title: "The Art of Focus",
        updatedAt: new Date("2026-05-02T00:00:00.000Z"),
      },
    ]);

    render(await DocumentsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole("button", { name: "Filter" })).not.toBeInTheDocument();
  });
});
