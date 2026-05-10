import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/vocabulary/route";
import { getRequiredSession, UnauthenticatedError } from "@/lib/auth";
import { saveVocabularyEntry, VocabularyValidationError } from "@/lib/vocabulary/service";

const authMocks = vi.hoisted(() => {
  class MockUnauthenticatedError extends Error {
    constructor() {
      super("UNAUTHENTICATED");
      this.name = "UnauthenticatedError";
    }
  }

  return {
    getRequiredSession: vi.fn(),
    UnauthenticatedError: MockUnauthenticatedError,
  };
});

const serviceMocks = vi.hoisted(() => {
  class MockVocabularyValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "VocabularyValidationError";
    }
  }

  return {
    saveVocabularyEntry: vi.fn(),
    VocabularyValidationError: MockVocabularyValidationError,
  };
});

vi.mock("@/lib/auth", () => authMocks);

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/vocabulary/service", () => serviceMocks);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/vocabulary", () => {
  it("returns 401 when the caller is not authenticated", async () => {
    vi.mocked(getRequiredSession).mockRejectedValue(new UnauthenticatedError());

    const response = await POST(createJsonRequest({ word: "observability" }));

    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(response.status).toBe(401);
    expect(saveVocabularyEntry).not.toHaveBeenCalled();
  });

  it("returns 400 for vocabulary validation errors", async () => {
    vi.mocked(getRequiredSession).mockResolvedValue({
      user: {
        id: "user_123",
        email: "owner@example.com",
      },
    } as never);
    vi.mocked(saveVocabularyEntry).mockRejectedValue(
      new VocabularyValidationError("Word is required"),
    );

    const response = await POST(createJsonRequest({ word: "" }));

    await expect(response.json()).resolves.toEqual({ error: "Word is required" });
    expect(response.status).toBe(400);
  });

  it("creates vocabulary entries for plugin callers", async () => {
    vi.mocked(getRequiredSession).mockResolvedValue({
      user: {
        id: "user_123",
        email: "owner@example.com",
      },
    } as never);
    vi.mocked(saveVocabularyEntry).mockResolvedValue({
      id: "entry_123",
      note: "",
      word: "observability",
      source: "plugin",
      wordListSlugs: ["cet6", "ielts"],
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
      updatedAt: new Date("2026-05-09T00:00:00.000Z"),
    });

    const response = await POST(
      createJsonRequest({
        word: "Observability",
        wordListSlugs: ["cet6", "ielts"],
        source: "plugin",
      }),
    );

    expect(saveVocabularyEntry).toHaveBeenCalledWith({
      ownerId: "user_123",
      word: "Observability",
      wordListSlugs: ["cet6", "ielts"],
      source: "plugin",
      prisma: expect.any(Object),
    });
    await expect(response.json()).resolves.toMatchObject({
      entry: {
        id: "entry_123",
        word: "observability",
        source: "plugin",
        wordListSlugs: ["cet6", "ielts"],
      },
    });
    expect(response.status).toBe(201);
  });
});

function createJsonRequest(payload: unknown) {
  return new Request("http://localhost/api/vocabulary", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
    },
  });
}
