import { describe, expect, it } from "vitest";
import { getBrowserExtensionLinks } from "@/lib/browser-extension-links";

describe("getBrowserExtensionLinks", () => {
  it("reads valid browser extension links from the environment", () => {
    expect(
      getBrowserExtensionLinks({
        BROWSER_EXTENSION_DOWNLOAD_URL: "https://example.com/eng-copilot-clipper.crx",
        BROWSER_EXTENSION_SUPPORT_URL: "mailto:support@example.com",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      downloadUrl: "https://example.com/eng-copilot-clipper.crx",
      supportUrl: "mailto:support@example.com",
    });
  });

  it("drops invalid browser extension links", () => {
    expect(
      getBrowserExtensionLinks({
        BROWSER_EXTENSION_DOWNLOAD_URL: "javascript:alert(1)",
        BROWSER_EXTENSION_SUPPORT_URL: "support.example.com",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      downloadUrl: null,
      supportUrl: null,
    });
  });
});
