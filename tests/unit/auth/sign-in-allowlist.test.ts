import { describe, expect, it } from "vitest";
import {
  isAdminEmail,
  isAllowedSignInEmailForSignIn,
} from "@/lib/sign-in-allowlist";

function createPrisma(emails: string[] = []) {
  return {
    allowedSignInEmail: {
      findMany: async () => emails.map((email) => ({ email })),
    },
  };
}

describe("isAllowedSignInEmailForSignIn", () => {
  it("allows sign-in for everyone when no allowlist is configured", async () => {
    const result = await isAllowedSignInEmailForSignIn({
      email: "reader@example.com",
      env: {},
      prisma: createPrisma(),
    });

    expect(result).toBe(true);
  });

  it("always allows the hardcoded admin email", async () => {
    const result = await isAllowedSignInEmailForSignIn({
      email: "ryan.alexander.zhang@gmail.com",
      env: {},
      prisma: createPrisma(["owner@example.com"]),
    });

    expect(result).toBe(true);
    expect(isAdminEmail("ryan.alexander.zhang@gmail.com")).toBe(true);
  });

  it("falls back to the environment allowlist while the managed list is empty", async () => {
    const allowed = await isAllowedSignInEmailForSignIn({
      email: "owner@example.com",
      env: {
        ALLOWED_SIGN_IN_EMAILS: "owner@example.com,editor@example.com",
      },
      prisma: createPrisma(),
    });
    const denied = await isAllowedSignInEmailForSignIn({
      email: "viewer@example.com",
      env: {
        ALLOWED_SIGN_IN_EMAILS: "owner@example.com,editor@example.com",
      },
      prisma: createPrisma(),
    });

    expect(allowed).toBe(true);
    expect(denied).toBe(false);
  });

  it("prefers the managed allowlist once at least one managed email exists", async () => {
    const allowed = await isAllowedSignInEmailForSignIn({
      email: "owner@example.com",
      env: {
        ALLOWED_SIGN_IN_EMAILS: "legacy@example.com",
      },
      prisma: createPrisma(["owner@example.com"]),
    });
    const denied = await isAllowedSignInEmailForSignIn({
      email: "legacy@example.com",
      env: {
        ALLOWED_SIGN_IN_EMAILS: "legacy@example.com",
      },
      prisma: createPrisma(["owner@example.com"]),
    });

    expect(allowed).toBe(true);
    expect(denied).toBe(false);
  });
});
