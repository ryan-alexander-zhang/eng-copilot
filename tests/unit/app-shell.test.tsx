import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn } from "next-auth/react";
import SignInPage from "@/app/sign-in/page";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("SignInPage", () => {
  it("renders the Google sign-in prompt", () => {
    render(<SignInPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Continue with Google to access your documents.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
  });

  it("starts Google sign-in with the owner shell callback", () => {
    const signInMock = vi.mocked(signIn);

    render(<SignInPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
    });
  });
});
