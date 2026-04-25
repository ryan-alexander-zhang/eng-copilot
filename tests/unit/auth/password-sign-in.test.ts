import { describe, expect, it, vi } from "vitest";
import { createPasswordSignInSession } from "@/lib/auth/password-sign-in";
import { hashPassword } from "@/lib/passwords";

describe("createPasswordSignInSession", () => {
  it("creates a session for a matching email and password", async () => {
    const create = vi.fn(async () => undefined);
    const passwordHash = await hashPassword("eng-copilot-dev");

    const result = await createPasswordSignInSession({
      identifier: "alex.chen@example.com",
      password: "eng-copilot-dev",
      prisma: {
        session: {
          create,
        },
        user: {
          findFirst: vi.fn(async () => ({
            id: "user-1",
            passwordHash,
          })),
        },
      },
    });

    expect(result?.sessionToken).toHaveLength(64);
    expect(create).toHaveBeenCalledOnce();
  });

  it("returns null for an invalid password", async () => {
    const passwordHash = await hashPassword("eng-copilot-dev");

    const result = await createPasswordSignInSession({
      identifier: "alex-chen",
      password: "wrong-password",
      prisma: {
        session: {
          create: vi.fn(async () => undefined),
        },
        user: {
          findFirst: vi.fn(async () => ({
            id: "user-1",
            passwordHash,
          })),
        },
      },
    });

    expect(result).toBeNull();
  });
});
