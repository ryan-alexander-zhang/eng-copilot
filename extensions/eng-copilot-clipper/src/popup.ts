import {
  buildClipUploadRequest,
  CLIP_PAGE_MESSAGE_TYPE,
  getUnsupportedPageReason,
  readClipperSettings,
  type ClipDocumentPayload,
} from "./shared";

const pageTitleElement = document.querySelector<HTMLHeadingElement>("#page-title");
const pageUrlElement = document.querySelector<HTMLParagraphElement>("#page-url");
const statusElement = document.querySelector<HTMLDivElement>("#status");
const clipButton = document.querySelector<HTMLButtonElement>("#clip-button");
const settingsButton = document.querySelector<HTMLButtonElement>("#settings-button");

if (!pageTitleElement || !pageUrlElement || !statusElement || !clipButton || !settingsButton) {
  throw new Error("Missing popup elements");
}

void initialize();

settingsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

async function initialize() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const url = tab?.url ?? "";
  const title = tab?.title?.trim() || "Untitled page";
  const settings = await readClipperSettings();

  pageTitleElement.textContent = title;
  pageUrlElement.textContent = url;

  if (!settings.serverBaseUrl || !settings.clipperToken) {
    clipButton.disabled = true;
    setStatus("Configure your server URL and clipper token first.", "error");
    return;
  }

  const unsupportedReason = getUnsupportedPageReason(url);

  if (!tab?.id || unsupportedReason) {
    clipButton.disabled = true;
    setStatus(unsupportedReason ?? "This page cannot be clipped.", "error");
    return;
  }

  setStatus("Ready to clip this page.");

  clipButton.addEventListener("click", async () => {
    clipButton.disabled = true;
    clipButton.textContent = "Clipping…";
    setStatus("Extracting article content from the current page.");

    try {
      const response = await chrome.tabs.sendMessage(tab.id!, {
        type: CLIP_PAGE_MESSAGE_TYPE,
      });

      if (!response?.ok) {
        throw new Error(response?.error || "The page could not be clipped.");
      }

      const upload = buildClipUploadRequest({
        payload: response.payload as ClipDocumentPayload,
        settings,
      });
      const uploadResponse = await fetch(upload.url, upload.init);
      const uploadPayload = (await uploadResponse.json()) as {
        documentUrl?: string;
        error?: string;
      };

      if (!uploadResponse.ok || !uploadPayload.documentUrl) {
        throw new Error(uploadPayload.error || "eng-copilot rejected the clipped page.");
      }

      await chrome.tabs.create({
        url: uploadPayload.documentUrl,
      });
      setStatus("Clipped successfully. Opening the new document…", "success");
      clipButton.textContent = "Clipped";
    } catch (error) {
      clipButton.disabled = false;
      clipButton.textContent = "Clip page";
      setStatus(error instanceof Error ? error.message : "Clip failed.", "error");
    }
  });
}

function setStatus(message: string, tone: "default" | "error" | "success" = "default") {
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
}
