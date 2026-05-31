import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signOut } from "next-auth/react";
import { UserMenuClient } from "@/components/layout/user-menu-client";

const replace = vi.fn();
let mockedSearchParams = new URLSearchParams();

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/documents",
  useRouter: () => ({
    replace,
  }),
  useSearchParams: () => mockedSearchParams,
}));

const baseProps = {
  browserExtensionLinks: {
    downloadUrl: "https://example.com/eng-copilot-clipper.zip",
    supportUrl: "https://support.example.com/browser-extension",
  },
  clipperTokenAction: vi.fn().mockResolvedValue({
    error: null,
    hasResult: false,
    preview: null,
    token: null,
  }),
  clipperTokenPreview: null,
  deleteAllDataAction: vi.fn().mockResolvedValue(undefined),
  hasPassword: true,
  updatePasswordAction: vi.fn().mockResolvedValue(undefined),
  updateProfileAction: vi.fn().mockResolvedValue(undefined),
  user: {
    displayName: "Jane Notes",
    email: "jane.notes@example.com",
    image: null,
    initial: "JN",
    username: "jane-notes",
  },
};

beforeEach(() => {
  mockedSearchParams = new URLSearchParams();
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UserMenuClient", () => {
  it("opens the browser extension panel from the user menu", () => {
    render(<UserMenuClient {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Browser Extension" }));

    expect(replace).toHaveBeenCalledWith("/documents?account=browser-extension", {
      scroll: false,
    });
  });

  it("renders the browser extension install dialog with copy and support actions", async () => {
    mockedSearchParams = new URLSearchParams("account=browser-extension");

    render(<UserMenuClient {...baseProps} />);

    expect(
      screen.getByRole("heading", { name: "Install Browser Extension" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Installation guide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute(
      "href",
      "https://support.example.com/browser-extension",
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy extension download link" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://example.com/eng-copilot-clipper.zip",
      );
    });
    expect(screen.getByRole("button", { name: "Copy extension download link" })).toHaveTextContent(
      "Copied",
    );
  });

  it("signs out back to the sign-in page", () => {
    const signOutMock = vi.mocked(signOut);

    render(<UserMenuClient {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(signOutMock).toHaveBeenCalledWith({
      callbackUrl: "/sign-in",
    });
  });
});
