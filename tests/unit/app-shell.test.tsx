import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signIn, signOut } from "next-auth/react";
import LandingPage from "@/app/page";
import SignInPage from "@/app/sign-in/page";
import SignInButton from "@/app/sign-in/sign-in-button";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/browser-extension-links", () => ({
  getBrowserExtensionLinks: () => ({
    downloadUrl: null,
    supportUrl: "mailto:ryan.alexander.zhang@gmail.com",
  }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

  return {
    ...actual,
    getRequiredSession: vi.fn(),
  };
});

beforeEach(() => {
  vi.mocked(getRequiredSession).mockRejectedValue(new UnauthenticatedError());
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LandingPage", () => {
  it("renders the public landing hero", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Make long Markdown documents easier to read, review, and share.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open your workspace" })).toHaveAttribute(
      "href",
      "/documents",
    );
  });
});

describe("SignInButton", () => {
  it("renders the sign-in page without unsupported auth entry points", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to continue to your workspace."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Remember me")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Forgot password?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pricing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Terms of Service" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Privacy Policy" })).not.toBeInTheDocument();
  });

  it("starts Google sign-in with the owner shell callback", () => {
    const signInMock = vi.mocked(signIn);

    render(<SignInButton callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
    });
  });

  it("honors a callbackUrl query parameter", async () => {
    const signInMock = vi.mocked(signIn);

    render(await SignInPage({ searchParams: Promise.resolve({ callbackUrl: "/shared/token" }) }));

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/shared/token",
    });
  });

  it("shows a Google OAuth error message when sign-in bootstrap fails", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({ error: "OAuthSignin" }) }));

    expect(
      screen.getByRole("alert", {
        name: "",
      }),
    ).toHaveTextContent(
      "Google sign-in could not be started. Check the Google OAuth settings and the server's outbound network access, then try again.",
    );
  });

  it("shows an access denied message when the email is not allowed", async () => {
    render(
      await SignInPage({
        searchParams: Promise.resolve({
          error: "AccessDenied",
        }),
      }),
    );

    expect(screen.getByRole("heading", { name: "Access Denied" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your account is not authorized to access this application. Please contact the administrator to request access.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ryan.alexander.zhang@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:ryan.alexander.zhang@gmail.com",
    );
    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email or username")).not.toBeInTheDocument();
  });

  it("lets denied users restart Google sign-in with account selection", async () => {
    render(
      await SignInPage({
        searchParams: Promise.resolve({
          callbackUrl: "/shared/token",
          error: "AccessDenied",
        }),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "signing in again" }));

    expect(vi.mocked(signIn)).toHaveBeenCalledWith("google", {
      callbackUrl: "/shared/token",
      prompt: "select_account",
    });
  });

  it("lets denied users sign out back to the sign-in page", async () => {
    render(
      await SignInPage({
        searchParams: Promise.resolve({
          error: "AccessDenied",
        }),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "signing out" }));

    expect(vi.mocked(signOut)).toHaveBeenCalledWith({
      callbackUrl: "/sign-in",
    });
  });
});
