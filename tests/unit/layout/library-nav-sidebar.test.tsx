import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LibraryNavSidebar } from "@/components/layout/library-nav-sidebar";

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

describe("LibraryNavSidebar", () => {
  it("renders library destinations as links", () => {
    render(
      <LibraryNavSidebar
        activeItem="documents"
        counts={{
          documents: 12,
          readOnlyLinks: 6,
          sharedWithMe: 4,
          trash: 2,
        }}
        storage={{
          progress: 0.1,
          totalLabel: "10 GB",
          usedLabel: "1 GB",
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: /Word Lists/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Annotations/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Shared with Me/i })).toHaveAttribute(
      "href",
      "/shared-with-me",
    );
    expect(screen.getByRole("link", { name: /Read-Only Links/i })).toHaveAttribute(
      "href",
      "/read-only-links",
    );
    expect(screen.getByRole("link", { name: /Trash/i })).toHaveAttribute("href", "/trash");
  });
});
