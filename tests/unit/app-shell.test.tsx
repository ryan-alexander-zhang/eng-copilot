import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn } from "next-auth/react";
import LandingPage from "@/app/page";
import SignInPage from "@/app/sign-in/page";
import SignInButton from "@/app/sign-in/sign-in-button";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

afterEach(() => {
  cleanup();
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
  it("renders the redesigned sign-in page", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to access your documents, annotations, and shared reading workspace."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
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
});
