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
  if (!error) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("401") || message.includes("로그인이 필요") || message.includes("인증되지 않은");
}

export function buildAuthGateHref(redirectValue: string): string {
  const redirectTo = sanitizeAuthRedirect(redirectValue);
  return `/auth?redirect=${encodeURIComponent(redirectTo)}`;
}
