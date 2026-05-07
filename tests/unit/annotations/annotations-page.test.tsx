import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnnotationsPage from "@/app/(app)/annotations/page";
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
    annotation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/components/annotations/annotations-filter-bar", () => ({
  AnnotationsFilterBar: () => <div>Filters</div>,
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

describe("AnnotationsPage", () => {
  it("uses a sidebar width aligned with the search rail", async () => {
    vi.mocked(prisma.annotation.findMany).mockResolvedValue([]);

    const view = render(
      await AnnotationsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    const totalSection = screen.getByText("Total").closest("section");
    expect(totalSection).not.toBeNull();
    const grid = totalSection?.parentElement?.parentElement;

    expect(grid).toHaveClass("xl:grid-cols-[274px_minmax(0,1fr)]");
    expect(view.getByRole("heading", { name: "Annotations" })).toBeInTheDocument();
  });
});
