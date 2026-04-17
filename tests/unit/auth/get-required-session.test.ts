import { describe, expect, it, vi } from "vitest";
import { getRequiredSession } from "@/lib/auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => null),
}));

describe("getRequiredSession", () => {
  it("throws when the request is unauthenticated", async () => {
    await expect(getRequiredSession()).rejects.toThrow("UNAUTHENTICATED");
  });
});
