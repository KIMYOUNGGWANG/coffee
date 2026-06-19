const defaultDashboardRedirect = "/dashboard";
const authRedirectBaseUrl = "http://hyangmi.local";

function isSupportedCheckoutIntent(value: string): boolean {
  switch (value) {
    case "premium_subscription":
    case "credits_10":
    case "pdf_book":
      return true;
    default:
      return false;
  }
}

function hasSafeCheckoutIntent(searchParams: URLSearchParams): boolean {
  const checkoutIntents = searchParams.getAll("checkout_intent");
  if (checkoutIntents.length === 0) {
    return true;
  }

  return checkoutIntents.length === 1 && isSupportedCheckoutIntent(checkoutIntents[0] ?? "");
}

export function sanitizeAuthRedirect(value: string | null): string {
  if (value === "/capture?resume=1") {
    return value;
  }

  if (!value || !value.startsWith("/dashboard")) {
    return defaultDashboardRedirect;
  }

  if (value.startsWith("//")) {
    return defaultDashboardRedirect;
  }

  if (!URL.canParse(value, authRedirectBaseUrl)) {
    return defaultDashboardRedirect;
  }

  const parsedUrl = new URL(value, authRedirectBaseUrl);
  if (parsedUrl.origin !== authRedirectBaseUrl || parsedUrl.pathname !== "/dashboard") {
    return defaultDashboardRedirect;
  }
  if (!hasSafeCheckoutIntent(parsedUrl.searchParams)) {
    return defaultDashboardRedirect;
  }
  return `${parsedUrl.pathname}${parsedUrl.search}`;
}

export function isAuthRequiredError(error: unknown): boolean {
  return false; // TEMPORARY BYPASS
}

export function buildAuthGateHref(redirectValue: string): string {
  const redirectTo = sanitizeAuthRedirect(redirectValue);
  return `/auth?redirect=${encodeURIComponent(redirectTo)}`;
}
