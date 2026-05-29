import { normalizeServerBaseUrl, readClipperSettings, writeClipperSettings } from "./shared";

const form = document.querySelector<HTMLFormElement>("#settings-form");
const serverBaseUrlInput = document.querySelector<HTMLInputElement>("#server-base-url");
const clipperTokenInput = document.querySelector<HTMLInputElement>("#clipper-token");
const statusElement = document.querySelector<HTMLDivElement>("#status");

if (!form || !serverBaseUrlInput || !clipperTokenInput || !statusElement) {
  throw new Error("Missing options page elements");
}

void initialize();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const serverBaseUrl = normalizeServerBaseUrl(serverBaseUrlInput.value);
    const clipperToken = clipperTokenInput.value.trim();

    if (!clipperToken) {
      throw new Error("Enter a clipper token before saving.");
    }

    await writeClipperSettings({
      serverBaseUrl,
      clipperToken,
    });

    setStatus("Settings saved.", "success");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Unable to save clipper settings.",
      "error",
    );
  }
});

async function initialize() {
  const settings = await readClipperSettings();

  serverBaseUrlInput.value = settings.serverBaseUrl;
  clipperTokenInput.value = settings.clipperToken;
  setStatus("Load your app URL and token to start clipping.");
}

function setStatus(message: string, tone: "default" | "error" | "success" = "default") {
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
}
