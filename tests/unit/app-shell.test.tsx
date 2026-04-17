import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignInPage from "@/app/sign-in/page";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("SignInPage", () => {
  it("renders the Google sign-in prompt", () => {
    render(<SignInPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Continue with Google to access your documents.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
  });
});
