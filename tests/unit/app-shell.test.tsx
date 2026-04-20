import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import SignInPage from "@/app/sign-in/page";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("SignInPage", () => {
  const useSearchParamsMock = vi.mocked(useSearchParams);

  afterEach(() => {
    useSearchParamsMock.mockReset();
  });

  it("renders the Google sign-in prompt", () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    render(<SignInPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Continue with Google to access your documents.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
  });

  it("starts Google sign-in with the owner shell callback", () => {
    const signInMock = vi.mocked(signIn);

    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    render(<SignInPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
    });
  });

  it("honors a callbackUrl query parameter", () => {
    const signInMock = vi.mocked(signIn);

    useSearchParamsMock.mockReturnValue(new URLSearchParams("callbackUrl=/shared/token"));

    render(<SignInPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/shared/token",
    });
  });
});
