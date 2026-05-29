import { describe, expect, it, vi } from "vitest";
import {
  buildClipUploadRequest,
  getUnsupportedPageReason,
  normalizeServerBaseUrl,
  readClipperSettings,
  writeClipperSettings,
} from "../../../extensions/eng-copilot-clipper/src/shared";

describe("clipper shared helpers", () => {
  it("normalizes the server base URL", () => {
    expect(normalizeServerBaseUrl("https://example.com/")).toBe("https://example.com");
    expect(normalizeServerBaseUrl("http://localhost:3000///")).toBe("http://localhost:3000");
  });

  it("builds the clip upload request payload", () => {
    expect(
      buildClipUploadRequest({
        settings: {
          serverBaseUrl: "https://example.com/",
          clipperToken: "ecp_token",
        },
        payload: {
          url: "https://site.test/article",
          title: "Article",
          markdown: "# Article",
        },
      }),
    ).toEqual({
      url: "https://example.com/api/documents/clip",
      init: {
        method: "POST",
        headers: {
          authorization: "Bearer ecp_token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: "https://site.test/article",
          title: "Article",
          markdown: "# Article",
        }),
      },
    });
  });

  it("flags unsupported pages", () => {
    expect(getUnsupportedPageReason("chrome://settings")).toMatch("cannot be clipped");
    expect(getUnsupportedPageReason("file:///tmp/article.html")).toMatch("not supported");
    expect(getUnsupportedPageReason("https://example.com/article.pdf")).toMatch("PDF viewer");
    expect(getUnsupportedPageReason("https://example.com/article")).toBeNull();
  });

  it("reads and writes settings through chrome storage", async () => {
    const storage = {
      get: vi.fn((_keys, callback) => {
        callback({
          serverBaseUrl: "http://localhost:3000",
          clipperToken: "ecp_token",
        });
      }),
      set: vi.fn((_items, callback) => {
        callback?.();
      }),
    };

    await expect(readClipperSettings(storage)).resolves.toEqual({
      serverBaseUrl: "http://localhost:3000",
      clipperToken: "ecp_token",
    });

    await writeClipperSettings(
      {
        serverBaseUrl: "https://example.com",
        clipperToken: "ecp_new",
      },
      storage,
    );

    expect(storage.set).toHaveBeenCalledWith(
      {
        serverBaseUrl: "https://example.com",
        clipperToken: "ecp_new",
      },
      expect.any(Function),
    );
  });
});
