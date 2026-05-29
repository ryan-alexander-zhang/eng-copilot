export const CLIP_PAGE_MESSAGE_TYPE = "eng-copilot:clip-page";

export type ClipperSettings = {
  clipperToken: string;
  serverBaseUrl: string;
};

export type ClipDocumentPayload = {
  markdown: string;
  title: string;
  url: string;
};

type StorageAreaLike = {
  get(
    keys: string[],
    callback: (items: Partial<Record<keyof ClipperSettings, string>>) => void,
  ): void;
  set(items: Partial<Record<keyof ClipperSettings, string>>, callback?: () => void): void;
};

export function normalizeServerBaseUrl(value: string) {
  const trimmedValue = value.trim().replace(/\/+$/, "");
  const parsedUrl = new URL(trimmedValue);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Use an http or https server URL.");
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export function getUnsupportedPageReason(url: string) {
  if (url.startsWith("chrome://")) {
    return "Chrome internal pages cannot be clipped.";
  }

  if (url.startsWith("chrome-extension://")) {
    return "Browser extension pages cannot be clipped.";
  }

  if (url.startsWith("file://")) {
    return "Local file URLs are not supported.";
  }

  if (
    url.startsWith("https://chromewebstore.google.com/") ||
    url.startsWith("https://chrome.google.com/webstore/")
  ) {
    return "The Chrome Web Store cannot be clipped.";
  }

  if (/\.pdf(?:$|[?#])/i.test(url)) {
    return "Browser PDF viewer pages are not supported.";
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "Only regular web pages can be clipped.";
  }

  return null;
}

export function buildClipUploadRequest(input: {
  payload: ClipDocumentPayload;
  settings: ClipperSettings;
}) {
  return {
    url: `${normalizeServerBaseUrl(input.settings.serverBaseUrl)}/api/documents/clip`,
    init: {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.settings.clipperToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input.payload),
    },
  };
}

export async function readClipperSettings(storage?: StorageAreaLike): Promise<ClipperSettings> {
  const area = resolveStorageArea(storage);

  return new Promise((resolve) => {
    area.get(["serverBaseUrl", "clipperToken"], (items) => {
      resolve({
        serverBaseUrl: typeof items.serverBaseUrl === "string" ? items.serverBaseUrl : "",
        clipperToken: typeof items.clipperToken === "string" ? items.clipperToken : "",
      });
    });
  });
}

export async function writeClipperSettings(
  settings: ClipperSettings,
  storage?: StorageAreaLike,
) {
  const area = resolveStorageArea(storage);

  await new Promise<void>((resolve) => {
    area.set(settings, () => resolve());
  });
}

function resolveStorageArea(storage?: StorageAreaLike) {
  if (storage) {
    return storage;
  }

  return chrome.storage.sync;
}
