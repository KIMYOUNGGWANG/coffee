import type Stripe from "stripe";

const CHECKOUT_ITEM_TYPES = [
  "credits_10",
  "pdf_book",
  "premium_subscription",
] as const;

export type CheckoutItemType = (typeof CHECKOUT_ITEM_TYPES)[number];
export type SupabaseError = { readonly code?: string; readonly message?: string };
export type ProcessingStatus = "processed" | "ignored" | "failed" | "processing" | "received";

type HyangmiTable = {
  readonly Row: Record<string, unknown>;
  readonly Insert: Record<string, unknown>;
  readonly Update: Record<string, unknown>;
  readonly Relationships: [];
};

export type HyangmiDatabase = {
  readonly public: {
    readonly Tables: {
      readonly profiles: HyangmiTable;
      readonly stripe_events: HyangmiTable;
      readonly entitlement_audit: HyangmiTable;
    };
    readonly Views: Record<string, never>;
    readonly Functions: Record<string, never>;
  };
};

type StripeExpandableId = string | { readonly id: string } | null;

export type CheckoutContext = {
  readonly event: Stripe.CheckoutSessionCompletedEvent;
  readonly session: Stripe.Checkout.Session;
  readonly userId: string;
  readonly itemType: CheckoutItemType;
  readonly stripeCustomerId: string | null;
  readonly stripeSessionId: string;
  readonly stripePaymentIntentId: string | null;
  readonly stripeSubscriptionId: string | null;
};

export type CheckoutContextResult =
  | { readonly kind: "ready"; readonly context: CheckoutContext }
  | { readonly kind: "invalid_metadata"; readonly message: string };

export type EventRecordResult =
  | { readonly kind: "recorded" }
  | { readonly kind: "duplicate" }
  | { readonly kind: "blocked"; readonly message: string };

export type IdentityDedupeResult =
  | { readonly kind: "clear" }
  | { readonly kind: "duplicate" }
  | { readonly kind: "failed"; readonly message: string };

export type FulfillmentResult =
  | { readonly kind: "fulfilled" }
  | { readonly kind: "failed"; readonly message: string };

export type EntitlementAuditInput = {
  readonly entitlementKind: "credits" | "pdf_access" | "subscription";
  readonly entitlementChange: "grant" | "increment";
  readonly previousValue: Record<string, unknown> | null;
  readonly newValue: Record<string, unknown>;
  readonly delta: number | null;
};

export function buildCheckoutContext(
  event: Stripe.CheckoutSessionCompletedEvent,
): CheckoutContextResult {
  const session = event.data.object;
  const userId = session.metadata?.user_id;
  const itemType = session.metadata?.item_type;

  if (!userId || !isCheckoutItemType(itemType)) {
    return { kind: "invalid_metadata", message: "Missing or invalid metadata parameters" };
  }

  return {
    kind: "ready",
    context: {
      event,
      session,
      userId,
      itemType,
      stripeCustomerId: stripeId(session.customer),
      stripeSessionId: session.id,
      stripePaymentIntentId: stripeId(session.payment_intent),
      stripeSubscriptionId: stripeId(session.subscription),
    },
  };
}

export function stripeEventInsert(context: CheckoutContext): Record<string, unknown> {
  return {
    event_id: context.event.id,
    event_type: context.event.type,
    event_created_at: new Date(context.event.created * 1000).toISOString(),
    livemode: context.event.livemode,
    api_version: context.event.api_version,
    user_id: context.userId,
    stripe_customer_id: context.stripeCustomerId,
    stripe_session_id: context.stripeSessionId,
    stripe_payment_intent_id: context.stripePaymentIntentId,
    stripe_subscription_id: context.stripeSubscriptionId,
    item_type: context.itemType,
    amount_total: context.session.amount_total,
    currency: context.session.currency,
    processing_status: "processing",
    checkout_metadata: context.session.metadata ?? {},
    payload: context.event,
  };
}

export function entitlementAuditInsert(
  context: CheckoutContext,
  audit: EntitlementAuditInput,
): Record<string, unknown> {
  return {
    user_id: context.userId,
    entitlement_kind: audit.entitlementKind,
    entitlement_change: audit.entitlementChange,
    source: "stripe",
    stripe_event_id: context.event.id,
    stripe_session_id: context.stripeSessionId,
    stripe_payment_intent_id: context.stripePaymentIntentId,
    stripe_customer_id: context.stripeCustomerId,
    stripe_subscription_id: context.stripeSubscriptionId,
    previous_value: audit.previousValue,
    new_value: audit.newValue,
    delta: audit.delta,
    event_metadata: checkoutEventMetadata(context),
  };
}

export function statusUpdate(
  processingStatus: ProcessingStatus,
  errorMessage: string | null,
): Record<string, unknown> {
  return {
    processing_status: processingStatus,
    processed_at: processingStatus === "processed" || processingStatus === "ignored"
      ? new Date().toISOString()
      : null,
    error_message: errorMessage,
  };
}

export function creditAudit(currentCredits: number, nextCredits: number): EntitlementAuditInput {
  return {
    entitlementKind: "credits",
    entitlementChange: "increment",
    previousValue: { credits: currentCredits },
    newValue: { credits: nextCredits },
    delta: 10,
  };
}

export function paidAccessAudit(
  itemType: "pdf_book" | "premium_subscription",
): EntitlementAuditInput {
  switch (itemType) {
    case "pdf_book":
      return {
        entitlementKind: "pdf_access",
        entitlementChange: "grant",
        previousValue: null,
        newValue: { has_pdf_access: true },
        delta: null,
      };
    case "premium_subscription":
      return {
        entitlementKind: "subscription",
        entitlementChange: "grant",
        previousValue: null,
        newValue: { is_premium: true },
        delta: null,
      };
  }
}

export function readCredits(profile: unknown): number {
  if (typeof profile !== "object" || profile === null || !("credits" in profile)) return 0;
  const credits = profile.credits;
  return typeof credits === "number" ? credits : 0;
}

export function readProcessingStatus(row: unknown): ProcessingStatus | null {
  if (typeof row !== "object" || row === null || !("processing_status" in row)) return null;
  const status = row.processing_status;
  if (status === "processed" || status === "ignored" || status === "failed") return status;
  if (status === "processing" || status === "received") return status;
  return null;
}

export function isUniqueViolation(error: SupabaseError): boolean {
  return error.code === "23505" || (error.message?.includes("duplicate key") ?? false);
}

export function supabaseMessage(error: SupabaseError): string {
  return error.message ?? "unknown Supabase error";
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

export function assertNever(value: never): never {
  throw new UnexpectedCheckoutItemTypeError(value);
}

function checkoutEventMetadata(context: CheckoutContext): Record<string, string | number | null> {
  return {
    item_type: context.itemType,
    mode: context.session.mode,
    amount_total: context.session.amount_total,
    currency: context.session.currency,
    stripe_session_id: context.stripeSessionId,
    stripe_payment_intent_id: context.stripePaymentIntentId,
    stripe_subscription_id: context.stripeSubscriptionId,
  };
}

function isCheckoutItemType(itemType: string | undefined): itemType is CheckoutItemType {
  return CHECKOUT_ITEM_TYPES.some((knownItemType) => knownItemType === itemType);
}

function stripeId(resource: StripeExpandableId): string | null {
  if (resource === null) return null;
  if (typeof resource === "string") return resource;
  return resource.id;
}

class UnexpectedCheckoutItemTypeError extends Error {
  readonly name = "UnexpectedCheckoutItemTypeError";

  constructor(itemType: never) {
    super(`Unexpected checkout item type: ${itemType}`);
  }
}
