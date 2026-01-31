/**
 * Builds a favicon URL for a given website URL using Google's favicon service.
 * Returns undefined for invalid URLs or special pages like about:blank.
 */
export function buildFaviconUrl(url: string): string | undefined {
  if (url === "about:blank" || !url) return undefined;

  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return undefined;
  }
}
