export const COFFEEDEX_WEB_URL =
  process.env.EXPO_PUBLIC_COFFEEDEX_WEB_URL ?? "https://coffee-lovat-psi.vercel.app";

const COFFEEDEX_ALLOWED_HOSTS = new Set([
  "coffee-lovat-psi.vercel.app",
  "accounts.google.com",
  "oauth2.googleapis.com",
  "www.googleapis.com",
]);

export function isCoffeeDexBridgeUrl(url: string) {
  if (url.startsWith("coffeedex://")) {
    return true;
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname.endsWith(".supabase.co")) {
      return true;
    }

    if (parsed.hostname.endsWith(".google.com")) {
      return true;
    }

    return COFFEEDEX_ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function getCoffeeDexWebUrl(path = "/") {
  return new URL(path, COFFEEDEX_WEB_URL).toString();
}

export function resolveCoffeeDexDeepLink(url: string) {
  if (!url.startsWith("coffeedex://")) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostPath = parsed.hostname ? `/${parsed.hostname}` : "";
    const routePath = `${hostPath}${parsed.pathname || "/"}`;

    return new URL(`${routePath}${parsed.search}${parsed.hash}`, COFFEEDEX_WEB_URL).toString();
  } catch {
    return COFFEEDEX_WEB_URL;
  }
}
