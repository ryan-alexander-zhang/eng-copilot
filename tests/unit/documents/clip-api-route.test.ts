import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPTIONS, POST } from "@/app/api/documents/clip/route";
import { findUserByClipperToken, touchClipperToken } from "@/lib/clipper/tokens";
import { createMarkdownDocument } from "@/lib/documents/create-markdown-document";

const clipperTokenMocks = vi.hoisted(() => ({
  findUserByClipperToken: vi.fn(),
  touchClipperToken: vi.fn(),
}));

const documentMocks = vi.hoisted(() => ({
  createMarkdownDocument: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/clipper/tokens", () => clipperTokenMocks);
vi.mock("@/lib/documents/create-markdown-document", () => documentMocks);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/documents/clip", () => {
  it("returns CORS headers for preflight requests", async () => {
    const response = OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")).toContain("Authorization");
  });

  it("returns 401 when the bearer token is missing", async () => {
    const response = await POST(createClipRequest({ markdown: "# Title", title: "Article" }));

    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(response.status).toBe(401);
    expect(findUserByClipperToken).not.toHaveBeenCalled();
    expect(createMarkdownDocument).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is invalid", async () => {
    vi.mocked(findUserByClipperToken).mockResolvedValue(null);

    const response = await POST(
      createClipRequest(
        { markdown: "# Title", title: "Article" },
        { authorization: "Bearer bad-token" },
      ),
    );

    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(response.status).toBe(401);
    expect(createMarkdownDocument).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid clip payloads", async () => {
    vi.mocked(findUserByClipperToken).mockResolvedValue({ id: "user_123" });

    const response = await POST(
      createClipRequest(
        { markdown: "   ", title: "Article", url: "javascript:alert(1)" },
        { authorization: "Bearer ecp_token" },
      ),
    );

    await expect(response.json()).resolves.toEqual({
      error: "A valid http or https URL is required",
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when the markdown payload is oversized", async () => {
    vi.mocked(findUserByClipperToken).mockResolvedValue({ id: "user_123" });

    const response = await POST(
      createClipRequest(
        {
          markdown: "a".repeat(10 * 1024 * 1024 + 1),
          title: "Article",
        },
        { authorization: "Bearer ecp_token" },
      ),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Markdown must be 10 MB or smaller",
    });
    expect(response.status).toBe(400);
  });

  it("creates a clipped markdown document and returns its URL", async () => {
    vi.mocked(findUserByClipperToken).mockResolvedValue({ id: "user_123" });
    vi.mocked(createMarkdownDocument).mockResolvedValue({
      id: "doc_123",
      title: "example.com",
    } as never);

    const response = await POST(
      createClipRequest(
        {
          markdown: "# Hello",
          title: "",
          url: "https://example.com/articles/hello",
        },
        { authorization: "Bearer ecp_token" },
      ),
    );

    expect(createMarkdownDocument).toHaveBeenCalledWith({
      ownerId: "user_123",
      title: "example.com",
      originalName: "example-com.md",
      rawMarkdown: "# Hello",
      sourceByteSize: 7,
      sourceUrl: "https://example.com/articles/hello",
      prisma: expect.any(Object),
    });
    expect(touchClipperToken).toHaveBeenCalledWith({
      userId: "user_123",
      prisma: expect.any(Object),
    });
    await expect(response.json()).resolves.toEqual({
      documentId: "doc_123",
      documentUrl: "http://localhost/documents/doc_123",
      title: "example.com",
    });
    expect(response.status).toBe(201);
  });
});

function createClipRequest(
  payload: {
    markdown: string;
    title: string;
    url?: string;
  },
  headers?: Record<string, string>,
) {
  return new Request("http://localhost/api/documents/clip", {
    method: "POST",
    body: JSON.stringify({
      url: payload.url ?? "https://example.com/post",
      title: payload.title,
      markdown: payload.markdown,
    }),
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}
