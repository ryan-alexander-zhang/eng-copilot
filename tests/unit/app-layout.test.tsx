import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import AppLayout from "@/app/(app)/layout";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

  return {
    ...actual,
    getRequiredSession: vi.fn(),
  };
});

describe("AppLayout", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to sign-in when the request is unauthenticated", async () => {
    vi.mocked(getRequiredSession).mockRejectedValueOnce(new UnauthenticatedError());

    await expect(
      AppLayout({
        children: <div>Owner Shell</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/sign-in");
  });

  it("rethrows unexpected auth errors", async () => {
    vi.mocked(getRequiredSession).mockRejectedValueOnce(new Error("DB unavailable"));

    await expect(
      AppLayout({
        children: <div>Owner Shell</div>,
      }),
    ).rejects.toThrow("DB unavailable");

    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });
});
