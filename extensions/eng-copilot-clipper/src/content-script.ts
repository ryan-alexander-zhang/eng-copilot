import Defuddle from "defuddle/full";
import { CLIP_PAGE_MESSAGE_TYPE, getUnsupportedPageReason } from "./shared";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== CLIP_PAGE_MESSAGE_TYPE) {
    return undefined;
  }

  void clipCurrentPage().then(sendResponse);

  return true;
});

async function clipCurrentPage() {
  const unsupportedReason = getUnsupportedPageReason(window.location.href);

  if (unsupportedReason) {
    return {
      ok: false,
      error: unsupportedReason,
    };
  }

  const result = new Defuddle(document, {
    markdown: true,
    useAsync: false,
    removeImages: false,
  }).parse();
  const markdown = typeof result.content === "string" ? result.content.trim() : "";

  if (!markdown) {
    return {
      ok: false,
      error: "No article content was extracted from this page.",
    };
  }

  return {
    ok: true,
    payload: {
      url: window.location.href,
      title: (result.title ?? document.title ?? "").trim(),
      markdown,
    },
  };
}
