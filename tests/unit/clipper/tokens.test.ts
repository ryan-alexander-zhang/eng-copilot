import { describe, expect, it, vi } from "vitest";
import {
  buildClipperTokenPreview,
  findUserByClipperToken,
  generateClipperToken,
  hashClipperToken,
  issueClipperToken,
  touchClipperToken,
} from "@/lib/clipper/tokens";

describe("clipper tokens", () => {
  it("generates prefixed tokens and preview strings", () => {
    const token = generateClipperToken();

    expect(token.startsWith("ecp_")).toBe(true);
    expect(buildClipperTokenPreview(token)).toMatch(/^ecp_.+….{4}$/);
  });

  it("hashes tokens before persistence", async () => {
    const update = vi.fn().mockResolvedValue({});

    const result = await issueClipperToken({
      userId: "user_123",
      prisma: {
        user: {
          update,
        },
      } as never,
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "user_123",
      },
      data: {
        clipperTokenHash: hashClipperToken(result.token),
        clipperTokenPreview: result.preview,
        clipperTokenCreatedAt: expect.any(Date),
        clipperTokenLastUsedAt: null,
      },
    });
    expect(result.preview).not.toContain(result.token.slice(6, -4));
  });

  it("looks up users by token hash", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "user_123" });

    const user = await findUserByClipperToken({
      token: "ecp_example-token",
      prisma: {
        user: {
          findUnique,
        },
      } as never,
    });

    expect(user).toEqual({ id: "user_123" });
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        clipperTokenHash: hashClipperToken("ecp_example-token"),
      },
      select: {
        id: true,
      },
    });
  });

  it("updates the last-used timestamp after a successful clip", async () => {
    const update = vi.fn().mockResolvedValue({});

    await touchClipperToken({
      userId: "user_123",
      prisma: {
        user: {
          update,
        },
      } as never,
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "user_123",
      },
      data: {
        clipperTokenLastUsedAt: expect.any(Date),
      },
    });
  });
});
