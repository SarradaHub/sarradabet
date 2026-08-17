const ALLOWED_IMAGE_URL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Returns a normalized http(s) URL safe for use in img[src], or null if invalid/unsafe.
 */
export function getSafeImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_IMAGE_URL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
