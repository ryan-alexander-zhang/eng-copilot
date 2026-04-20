import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn } from "next-auth/react";
import SignInPage from "@/app/sign-in/page";
import SignInButton from "@/app/sign-in/sign-in-button";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("SignInButton", () => {
  it("renders the Google sign-in prompt", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Continue with Google to access your documents.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
  });

  it("starts Google sign-in with the owner shell callback", () => {
    const signInMock = vi.mocked(signIn);

    render(<SignInButton callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
    });
  });

  it("honors a callbackUrl query parameter", async () => {
    const signInMock = vi.mocked(signIn);

    render(await SignInPage({ searchParams: Promise.resolve({ callbackUrl: "/shared/token" }) }));

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/shared/token",
    });
  });
});
