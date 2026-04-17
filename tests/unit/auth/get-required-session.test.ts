import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { authOptions, getRequiredSession } from "@/lib/auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("getRequiredSession", () => {
  const getServerSessionMock = vi.mocked(getServerSession);

  afterEach(() => {
    getServerSessionMock.mockReset();
  });

  it("throws when the request is unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(getRequiredSession()).rejects.toThrow("UNAUTHENTICATED");
  });

  it("throws when the session is missing the owner id", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        email: "owner@example.com",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });

    await expect(getRequiredSession()).rejects.toThrow("UNAUTHENTICATED");
  });

  it("returns the session when owner id and email are present", async () => {
    const session = {
      user: {
        id: "user_123",
        email: "owner@example.com",
      },
      expires: "2099-01-01T00:00:00.000Z",
    };

    getServerSessionMock.mockResolvedValue(session);

    await expect(getRequiredSession()).resolves.toEqual(session);
  });

  it("adds the owner id to the session in the NextAuth callback", async () => {
    const session = await authOptions.callbacks?.session?.({
      session: {
        user: {
          email: "owner@example.com",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      user: {
        id: "user_123",
        email: "owner@example.com",
        emailVerified: null,
      },
    } as never);

    expect(session?.user.id).toBe("user_123");
  });
});
