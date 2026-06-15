import { z } from "zod";

const checkoutItemTypeSchema = z.enum(["premium_subscription", "credits_10", "pdf_book"]);
const checkoutReturnSearchSchema = z.object({
  checkout_status: z.enum(["success", "cancel"]).nullable(),
  item_type: checkoutItemTypeSchema.nullable(),
});
const checkoutIntentSearchSchema = z.object({
  checkout_intent: checkoutItemTypeSchema.nullable(),
});

export type CheckoutItemType = z.infer<typeof checkoutItemTypeSchema>;
export type CheckoutNotice =
  | { readonly status: "success"; readonly itemType: CheckoutItemType | null }
  | { readonly status: "cancel"; readonly itemType: null };
export type CheckoutIntent =
  | { readonly kind: "checkout"; readonly itemType: CheckoutItemType }
  | { readonly kind: "none" };

type SearchParamRecord = Record<string, string | readonly string[] | undefined>;

function firstSearchParam(value: string | readonly string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0] ?? null;
}

export function readCheckoutNoticeFromRecord(searchParams: SearchParamRecord): CheckoutNotice | null {
  return readCheckoutNotice({
    checkout_status: firstSearchParam(searchParams.checkout_status),
    item_type: firstSearchParam(searchParams.item_type),
  });
}

export function readCheckoutNoticeFromSearch(search: string): CheckoutNotice | null {
  const searchParams = new URLSearchParams(search);
  return readCheckoutNotice({
    checkout_status: searchParams.get("checkout_status"),
    item_type: searchParams.get("item_type"),
  });
}

export function readCheckoutIntentFromRecord(searchParams: SearchParamRecord): CheckoutIntent {
  return readCheckoutIntent({
    checkout_intent: firstSearchParam(searchParams.checkout_intent),
  });
}

export function readCheckoutIntentFromSearch(search: string): CheckoutIntent {
  const searchParams = new URLSearchParams(search);
  return readCheckoutIntent({
    checkout_intent: searchParams.get("checkout_intent"),
  });
}

export function buildDashboardCheckoutIntentHref(itemType: CheckoutItemType): string {
  const searchParams = new URLSearchParams();
  searchParams.set("checkout_intent", itemType);
  return `/dashboard?${searchParams.toString()}`;
}

function readCheckoutNotice(input: { readonly checkout_status: string | null; readonly item_type: string | null }): CheckoutNotice | null {
  const parsedSearch = checkoutReturnSearchSchema.safeParse(input);
  if (!parsedSearch.success) {
    return null;
  }

  switch (parsedSearch.data.checkout_status) {
    case "success":
      return { status: "success", itemType: parsedSearch.data.item_type };
    case "cancel":
      return { status: "cancel", itemType: null };
    case null:
      return null;
    default:
      return null;
  }
}

function readCheckoutIntent(input: { readonly checkout_intent: string | null }): CheckoutIntent {
  const parsedSearch = checkoutIntentSearchSchema.safeParse(input);
  if (!parsedSearch.success || !parsedSearch.data.checkout_intent) {
    return { kind: "none" };
  }

  return {
    kind: "checkout",
    itemType: parsedSearch.data.checkout_intent,
  };
}
