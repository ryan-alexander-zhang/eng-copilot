import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signOut } from "next-auth/react";
import { UserMenu } from "@/components/layout/user-menu";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UserMenu", () => {
  it("shows settings and logout actions", () => {
    render(<UserMenu userInitial="JN" />);

    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("signs out back to the sign-in page", () => {
    const signOutMock = vi.mocked(signOut);

    render(<UserMenu userInitial="JN" />);

    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(signOutMock).toHaveBeenCalledWith({
      callbackUrl: "/sign-in",
    });
  });
});
