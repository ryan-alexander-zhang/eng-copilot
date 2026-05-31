export type BrowserExtensionLinks = {
  downloadUrl: string | null;
  supportUrl: string | null;
};

function normalizeBrowserExtensionLink(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function getBrowserExtensionLinks(
  env: NodeJS.ProcessEnv = process.env,
): BrowserExtensionLinks {
  return {
    downloadUrl: normalizeBrowserExtensionLink(env.BROWSER_EXTENSION_DOWNLOAD_URL),
    supportUrl: normalizeBrowserExtensionLink(env.BROWSER_EXTENSION_SUPPORT_URL),
  };
}
