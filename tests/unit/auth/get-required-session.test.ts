import { afterEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { ProxyAgent } from "undici";
import {
  applySessionUserId,
  createGoogleAuthFetch,
  getGoogleHttpOptions,
} from "@/lib/auth-config";
import { getRequiredSession } from "@/lib/auth";

const { cookiesMock, sessionFindUniqueMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  sessionFindUniqueMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: sessionFindUniqueMock,
    },
  },
}));

describe("getRequiredSession", () => {
  const authMock = vi.mocked(auth);

  afterEach(() => {
    authMock.mockReset();
    cookiesMock.mockReset();
    sessionFindUniqueMock.mockReset();
  });

  it("throws when the request is unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    await expect(getRequiredSession()).rejects.toThrow("UNAUTHENTICATED");
  });

  it("throws when the session is missing the owner id", async () => {
    authMock.mockResolvedValue({
      user: {
        email: "owner@example.com",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });
    cookiesMock.mockResolvedValue({
      get: () => undefined,
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

    authMock.mockResolvedValue(session);

    await expect(getRequiredSession()).resolves.toEqual(session);
  });

  it("falls back to the database session when the auth helper returns null", async () => {
    authMock.mockResolvedValue(null);
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "authjs.session-token" ? { value: "token_123" } : undefined,
    });
    sessionFindUniqueMock.mockResolvedValue({
      expires: new Date("2099-01-01T00:00:00.000Z"),
      user: {
        email: "owner@example.com",
        id: "user_123",
        image: null,
        name: "Owner",
      },
    });

    await expect(getRequiredSession()).resolves.toEqual({
      expires: "2099-01-01T00:00:00.000Z",
      user: {
        email: "owner@example.com",
        id: "user_123",
        image: null,
        name: "Owner",
      },
    });
  });

  it("adds the owner id to the session in the NextAuth callback", async () => {
    const session = await applySessionUserId({
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

  it("uses a longer Google discovery timeout without a proxy", () => {
    expect(getGoogleHttpOptions({})).toEqual({
      proxyUrl: undefined,
      timeoutMs: 10_000,
    });
  });

  it("returns the configured proxy URL when a proxy is present", () => {
    expect(
      getGoogleHttpOptions({
        HTTPS_PROXY: "http://127.0.0.1:7890",
      }),
    ).toEqual({
      proxyUrl: "http://127.0.0.1:7890",
      timeoutMs: 10_000,
    });
  });

  it("uses an undici proxy dispatcher when a proxy is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    const googleFetch = createGoogleAuthFetch({
      HTTPS_PROXY: "http://127.0.0.1:7890",
    });

    await googleFetch("https://accounts.google.com");

    const [, init] = fetchMock.mock.calls[0];

    global.fetch = originalFetch;

    expect(init.dispatcher).toBeInstanceOf(ProxyAgent);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("still applies a timeout when no proxy is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    const googleFetch = createGoogleAuthFetch({});

    await googleFetch("https://accounts.google.com");

    const [, init] = fetchMock.mock.calls[0];

    global.fetch = originalFetch;

    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.dispatcher).toBeUndefined();
  });

});
