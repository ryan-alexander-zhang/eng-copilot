import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SharedWithMePage from "@/app/(app)/shared-with-me/page";
import ReadOnlyLinksPage from "@/app/(app)/read-only-links/page";
import TrashPage from "@/app/(app)/trash/page";
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
      count: vi.fn(),
      findMany: vi.fn(),
    },
    documentShare: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/components/layout/document-upload-sidebar", () => ({
  DocumentUploadSidebar: () => <div>Upload</div>,
}));

vi.mock("@/components/layout/library-nav-sidebar", () => ({
  LibraryNavSidebar: () => <div>Library nav</div>,
}));

vi.mock("@/components/layout/owner-top-bar", () => ({
  OwnerTopBar: () => <div>Top bar</div>,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Library pages", () => {
  it("renders the shared with me page", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValueOnce([
      {
        rawMarkdown: "# My doc",
      },
    ]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);
    vi.mocked(prisma.documentShare.count).mockResolvedValue(1);
    vi.mocked(prisma.documentShare.findMany).mockResolvedValueOnce([
      {
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        document: {
          _count: {
            annotations: 2,
          },
          activeLists: [
            {
              wordList: {
                name: "CET4",
              },
            },
          ],
          originalName: "shared-doc.md",
          owner: {
            email: "alice@example.com",
            name: "Alice",
          },
          title: "Shared doc",
          updatedAt: new Date("2026-05-02T00:00:00.000Z"),
        },
        token: "share-token",
        updatedAt: new Date("2026-05-03T00:00:00.000Z"),
      },
    ]);

    render(await SharedWithMePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Shared with Me" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shared doc" })).toHaveAttribute(
      "href",
      "/shared/share-token",
    );
  });

  it("renders the read-only links page", async () => {
    vi.mocked(prisma.document.findMany)
      .mockResolvedValueOnce([
        {
          rawMarkdown: "# My doc",
        },
      ])
      .mockResolvedValueOnce([
        {
          _count: {
            annotations: 3,
          },
          id: "doc_1",
          originalName: "guide.md",
          share: {
            createdAt: new Date("2026-05-01T00:00:00.000Z"),
            token: "readonly-token",
            updatedAt: new Date("2026-05-03T00:00:00.000Z"),
          },
          title: "Guide",
          updatedAt: new Date("2026-05-04T00:00:00.000Z"),
        },
    ]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);
    vi.mocked(prisma.documentShare.count).mockResolvedValue(1);

    render(await ReadOnlyLinksPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Read-Only Links" })).toBeInTheDocument();
    expect(screen.getByText("/shared/readonly-token")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute(
      "href",
      "/shared/readonly-token",
    );
  });

  it("renders the trash page", async () => {
    vi.mocked(prisma.document.findMany)
      .mockResolvedValueOnce([
        {
          rawMarkdown: "# My doc",
        },
      ])
      .mockResolvedValueOnce([
        {
          _count: {
            annotations: 1,
          },
          originalName: "archive.md",
          rawMarkdown: "# Archive\n\nOld notes",
          title: "Archive",
          trashedAt: new Date("2026-05-05T00:00:00.000Z"),
          updatedAt: new Date("2026-05-04T00:00:00.000Z"),
        },
    ]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);
    vi.mocked(prisma.documentShare.count).mockResolvedValue(0);

    render(await TrashPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Trash" })).toBeInTheDocument();
    expect(screen.getByText("Archive.md")).toBeInTheDocument();
  });
});
