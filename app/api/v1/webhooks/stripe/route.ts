import { NextRequest, NextResponse } from "next/server";
import { readStarterEnv } from "@/lib/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  assertNever,
  buildCheckoutContext,
  creditAudit,
  entitlementAuditInsert,
  getErrorMessage,
  isUniqueViolation,
  paidAccessAudit,
  readCredits,
  readProcessingStatus,
  statusUpdate,
  stripeEventInsert,
  supabaseMessage,
  type CheckoutContext,
  type HyangmiDatabase,
  type EntitlementAuditInput,
  type EventRecordResult,
  type FulfillmentResult,
  type IdentityDedupeResult,
  type ProcessingStatus,
} from "@/lib/stripe-fulfillment";

type SupabaseAdminClient = SupabaseClient<HyangmiDatabase>;
type StripeExpandableId = string | { readonly id: string } | null | undefined;
type SubscriptionLifecycleEvent =
  | Stripe.CustomerSubscriptionCreatedEvent
  | Stripe.CustomerSubscriptionUpdatedEvent
  | Stripe.CustomerSubscriptionDeletedEvent;
type InvoiceLifecycleEvent = Stripe.InvoicePaidEvent | Stripe.InvoicePaymentFailedEvent;
type SubscriptionStatus =
  | "inactive"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";
type SubscriptionLifecycleContext = {
  readonly event: Stripe.Event;
  readonly userId: string | null;
  readonly stripeCustomerId: string | null;
  readonly stripeSubscriptionId: string | null;
  readonly stripeInvoiceId: string | null;
  readonly payload: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const env = readStarterEnv(process.env);
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const rawBody = await request.text();
    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Webhook Signature verification failed: ${message}`);
      return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    const supabaseAdmin = createClient<HyangmiDatabase>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    switch (event.type) {
      case "checkout.session.completed":
        return handleCheckoutSessionCompleted(event, supabaseAdmin);
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return handleSubscriptionLifecycle(event, supabaseAdmin);
      case "invoice.paid":
      case "invoice.payment_failed":
        return handleInvoiceLifecycle(event, supabaseAdmin);
      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) { // no-excuse-ok: catch
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
  supabaseAdmin: SupabaseAdminClient,
) {
  const contextResult = buildCheckoutContext(event);
  if (contextResult.kind === "invalid_metadata") {
    console.error(contextResult.message);
    return NextResponse.json({ error: contextResult.message }, { status: 400 });
  }

  const context = contextResult.context;
  const recordResult = await recordStripeEvent(supabaseAdmin, context);
  if (recordResult.kind === "duplicate") {
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (recordResult.kind === "blocked") {
    return NextResponse.json({ error: recordResult.message }, { status: 500 });
  }

  const identityResult = await dedupeCheckoutIdentity(supabaseAdmin, context);
  if (identityResult.kind === "duplicate") {
    await updateStripeEventStatus(supabaseAdmin, context.event.id, "ignored", null);
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (identityResult.kind === "failed") {
    await updateStripeEventStatus(supabaseAdmin, context.event.id, "failed", identityResult.message);
    return NextResponse.json({ error: identityResult.message }, { status: 500 });
  }

  const fulfillmentResult = await applyCheckoutFulfillment(supabaseAdmin, context);
  if (fulfillmentResult.kind === "failed") {
    await updateStripeEventStatus(supabaseAdmin, context.event.id, "failed", fulfillmentResult.message);
    return NextResponse.json({ error: fulfillmentResult.message }, { status: 500 });
  }

  const processedResult = await updateStripeEventStatus(supabaseAdmin, context.event.id, "processed", null);
  if (processedResult.kind === "failed") {
    return NextResponse.json({ error: processedResult.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function recordStripeEvent(
  supabaseAdmin: SupabaseAdminClient,
  context: CheckoutContext,
): Promise<EventRecordResult> {
  const { error } = await supabaseAdmin
    .from("stripe_events")
    .insert(stripeEventInsert(context));

  if (!error) return { kind: "recorded" };
  if (!isUniqueViolation(error)) {
    return { kind: "blocked", message: `Failed to record Stripe event: ${supabaseMessage(error)}` };
  }

  return resolveDuplicateEvent(supabaseAdmin, context.event.id);
}

async function resolveDuplicateEvent(
  supabaseAdmin: SupabaseAdminClient,
  eventId: string,
): Promise<EventRecordResult> {
  const { data, error } = await supabaseAdmin
    .from("stripe_events")
    .select("processing_status")
    .eq("event_id", eventId)
    .single();

  if (error) return { kind: "blocked", message: `Failed to read duplicate Stripe event: ${supabaseMessage(error)}` };

  const status = readProcessingStatus(data);
  if (status === "processed" || status === "ignored") return { kind: "duplicate" };
  return { kind: "blocked", message: "Stripe event is already recorded but not processed" };
}

async function dedupeCheckoutIdentity(
  supabaseAdmin: SupabaseAdminClient,
  context: CheckoutContext,
): Promise<IdentityDedupeResult> {
  const sessionResult = await findProcessedIdentity(
    supabaseAdmin,
    "stripe_session_id",
    context.stripeSessionId,
    context.event.id,
  );
  if (sessionResult.kind !== "clear") return sessionResult;
  if (!context.stripePaymentIntentId) return { kind: "clear" };

  return findProcessedIdentity(
    supabaseAdmin,
    "stripe_payment_intent_id",
    context.stripePaymentIntentId,
    context.event.id,
  );
}

async function findProcessedIdentity(
  supabaseAdmin: SupabaseAdminClient,
  column: "stripe_session_id" | "stripe_payment_intent_id",
  value: string,
  eventId: string,
): Promise<IdentityDedupeResult> {
  const { data, error } = await supabaseAdmin
    .from("stripe_events")
    .select("event_id")
    .eq(column, value)
    .eq("processing_status", "processed")
    .neq("event_id", eventId)
    .limit(1);

  if (error) return { kind: "failed", message: `Failed to check Stripe identity: ${supabaseMessage(error)}` };
  return Array.isArray(data) && data.length > 0 ? { kind: "duplicate" } : { kind: "clear" };
}

async function applyCheckoutFulfillment(
  supabaseAdmin: SupabaseAdminClient,
  context: CheckoutContext,
): Promise<FulfillmentResult> {
  switch (context.itemType) {
    case "credits_10":
      return grantCredits(supabaseAdmin, context);
    case "pdf_book":
      return grantProfileFlag(
        supabaseAdmin,
        context,
        { has_pdf_access: true },
        paidAccessAudit("pdf_book"),
      );
    case "premium_subscription":
      return grantProfileFlag(
        supabaseAdmin,
        context,
        {
          is_premium: true,
          stripe_customer_id: context.stripeCustomerId,
          stripe_subscription_id: context.stripeSubscriptionId,
          subscription_status: "active",
          subscription_updated_at: new Date().toISOString(),
        },
        paidAccessAudit("premium_subscription"),
      );
    default:
      return assertNever(context.itemType);
  }
}

async function grantCredits(
  supabaseAdmin: SupabaseAdminClient,
  context: CheckoutContext,
): Promise<FulfillmentResult> {
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", context.userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return { kind: "failed", message: `Failed to fetch user profile: ${supabaseMessage(fetchError)}` };
  }

  const currentCredits = readCredits(profile);
  const nextCredits = currentCredits + 10;
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: context.userId, credits: nextCredits });

  if (updateError) return { kind: "failed", message: `Failed to top-up user credits: ${supabaseMessage(updateError)}` };

  return recordEntitlementAudit(supabaseAdmin, context, creditAudit(currentCredits, nextCredits));
}

async function grantProfileFlag(
  supabaseAdmin: SupabaseAdminClient,
  context: CheckoutContext,
  profilePatch: Record<string, string | boolean | null>,
  audit: EntitlementAuditInput,
): Promise<FulfillmentResult> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: context.userId, ...profilePatch });

  if (error) return { kind: "failed", message: `Failed to update user entitlement: ${supabaseMessage(error)}` };
  return recordEntitlementAudit(supabaseAdmin, context, audit);
}

async function handleSubscriptionLifecycle(
  event: SubscriptionLifecycleEvent,
  supabaseAdmin: SupabaseAdminClient,
) {
  const subscription = event.data.object;
  const stripeCustomerId = stripeResourceId(subscription.customer);
  const stripeSubscriptionId = subscription.id;
  const userId = await resolveProfileUserId(
    supabaseAdmin,
    subscription.metadata?.user_id,
    stripeSubscriptionId,
    stripeCustomerId,
  );

  const context: SubscriptionLifecycleContext = {
    event,
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    stripeInvoiceId: null,
    payload: subscription,
  };
  return processSubscriptionLifecycleContext(
    supabaseAdmin,
    context,
    subscriptionProfilePatch(event.type, subscription),
    event.type === "customer.subscription.deleted" ? "revoke" : "sync",
  );
}

async function handleInvoiceLifecycle(
  event: InvoiceLifecycleEvent,
  supabaseAdmin: SupabaseAdminClient,
) {
  const invoice = event.data.object;
  const stripeCustomerId = stripeResourceId(invoice.customer);
  const stripeSubscriptionId = invoiceSubscriptionId(invoice);
  const userId = await resolveProfileUserId(
    supabaseAdmin,
    invoice.parent?.subscription_details?.metadata?.user_id ?? invoice.metadata?.user_id,
    stripeSubscriptionId,
    stripeCustomerId,
  );
  const invoiceStatus = event.type === "invoice.paid" ? "paid" : "payment_failed";
  const subscriptionStatus = event.type === "invoice.paid" ? "active" : "past_due";
  const context: SubscriptionLifecycleContext = {
    event,
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    stripeInvoiceId: invoice.id,
    payload: invoice,
  };

  return processSubscriptionLifecycleContext(
    supabaseAdmin,
    context,
    {
      is_premium: event.type === "invoice.paid",
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: subscriptionStatus,
      subscription_current_period_end: isoFromEpoch(invoice.period_end),
      subscription_cancel_at_period_end: false,
      subscription_last_invoice_id: invoice.id,
      subscription_last_invoice_status: invoiceStatus,
      subscription_updated_at: new Date().toISOString(),
    },
    "sync",
  );
}

async function processSubscriptionLifecycleContext(
  supabaseAdmin: SupabaseAdminClient,
  context: SubscriptionLifecycleContext,
  profilePatch: Record<string, string | boolean | null>,
  entitlementChange: "sync" | "revoke",
) {
  const recordResult = await recordLifecycleStripeEvent(supabaseAdmin, context);
  if (recordResult.kind === "duplicate") {
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (recordResult.kind === "blocked") {
    return NextResponse.json({ error: recordResult.message }, { status: 500 });
  }

  if (!context.userId) {
    await updateStripeEventStatus(supabaseAdmin, context.event.id, "ignored", "No matching profile for subscription lifecycle event");
    return NextResponse.json({ received: true, ignored: true });
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: context.userId, ...profilePatch });

  if (updateError) {
    const message = `Failed to update subscription profile: ${supabaseMessage(updateError)}`;
    await updateStripeEventStatus(supabaseAdmin, context.event.id, "failed", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const auditResult = await recordSubscriptionAudit(supabaseAdmin, context, entitlementChange, profilePatch);
  if (auditResult.kind === "failed") {
    await updateStripeEventStatus(supabaseAdmin, context.event.id, "failed", auditResult.message);
    return NextResponse.json({ error: auditResult.message }, { status: 500 });
  }

  const processedResult = await updateStripeEventStatus(supabaseAdmin, context.event.id, "processed", null);
  if (processedResult.kind === "failed") {
    return NextResponse.json({ error: processedResult.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function recordLifecycleStripeEvent(
  supabaseAdmin: SupabaseAdminClient,
  context: SubscriptionLifecycleContext,
): Promise<EventRecordResult> {
  const { error } = await supabaseAdmin
    .from("stripe_events")
    .insert({
      event_id: context.event.id,
      event_type: context.event.type,
      event_created_at: new Date(context.event.created * 1000).toISOString(),
      livemode: context.event.livemode,
      api_version: context.event.api_version,
      user_id: context.userId,
      stripe_customer_id: context.stripeCustomerId,
      stripe_subscription_id: context.stripeSubscriptionId,
      stripe_invoice_id: context.stripeInvoiceId,
      item_type: "premium_subscription",
      processing_status: "processing",
      checkout_metadata: {},
      payload: context.event,
    });

  if (!error) return { kind: "recorded" };
  if (!isUniqueViolation(error)) {
    return { kind: "blocked", message: `Failed to record Stripe event: ${supabaseMessage(error)}` };
  }

  return resolveDuplicateEvent(supabaseAdmin, context.event.id);
}

async function recordSubscriptionAudit(
  supabaseAdmin: SupabaseAdminClient,
  context: SubscriptionLifecycleContext,
  entitlementChange: "sync" | "revoke",
  profilePatch: Record<string, string | boolean | null>,
): Promise<FulfillmentResult> {
  if (!context.userId) return { kind: "failed", message: "Missing user ID for subscription audit" };

  const { error } = await supabaseAdmin
    .from("entitlement_audit")
    .insert({
      user_id: context.userId,
      entitlement_kind: "subscription",
      entitlement_change: entitlementChange,
      source: "stripe",
      stripe_event_id: context.event.id,
      stripe_customer_id: context.stripeCustomerId,
      stripe_subscription_id: context.stripeSubscriptionId,
      previous_value: null,
      new_value: profilePatch,
      delta: null,
      event_metadata: {
        event_type: context.event.type,
        stripe_invoice_id: context.stripeInvoiceId,
        stripe_subscription_id: context.stripeSubscriptionId,
      },
    });

  if (error) return { kind: "failed", message: `Failed to record subscription audit: ${supabaseMessage(error)}` };
  return { kind: "fulfilled" };
}

async function resolveProfileUserId(
  supabaseAdmin: SupabaseAdminClient,
  explicitUserId: string | undefined,
  stripeSubscriptionId: string | null,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (explicitUserId) return explicitUserId;

  const subscriptionUserId = await readProfileUserId(supabaseAdmin, "stripe_subscription_id", stripeSubscriptionId);
  if (subscriptionUserId) return subscriptionUserId;
  return readProfileUserId(supabaseAdmin, "stripe_customer_id", stripeCustomerId);
}

async function readProfileUserId(
  supabaseAdmin: SupabaseAdminClient,
  column: "stripe_subscription_id" | "stripe_customer_id",
  value: string | null,
): Promise<string | null> {
  if (!value) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq(column, value)
    .single();

  if (error) return null;
  return readId(data);
}

function subscriptionProfilePatch(
  eventType: SubscriptionLifecycleEvent["type"],
  subscription: Stripe.Subscription,
): Record<string, string | boolean | null> {
  const subscriptionStatus = eventType === "customer.subscription.deleted"
    ? "canceled"
    : normalizeSubscriptionStatus(subscription.status);

  return {
    is_premium: isPremiumSubscriptionStatus(subscriptionStatus),
    stripe_customer_id: stripeResourceId(subscription.customer),
    stripe_subscription_id: subscription.id,
    subscription_status: subscriptionStatus,
    subscription_current_period_end: isoFromEpoch(
      subscription.items.data[0]?.current_period_end ?? null,
    ),
    subscription_cancel_at_period_end: subscription.cancel_at_period_end,
    subscription_last_invoice_id: stripeResourceId(subscription.latest_invoice),
    subscription_last_invoice_status: null,
    subscription_updated_at: new Date().toISOString(),
  };
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return stripeResourceId(invoice.parent?.subscription_details?.subscription ?? null);
}

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  return status;
}

function isPremiumSubscriptionStatus(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

function isoFromEpoch(epochSeconds: number | null): string | null {
  return epochSeconds ? new Date(epochSeconds * 1000).toISOString() : null;
}

function stripeResourceId(resource: StripeExpandableId): string | null {
  if (!resource) return null;
  if (typeof resource === "string") return resource;
  return resource.id;
}

function readId(row: unknown): string | null {
  if (typeof row !== "object" || row === null || !("id" in row)) return null;
  return typeof row.id === "string" ? row.id : null;
}

async function recordEntitlementAudit(
  supabaseAdmin: SupabaseAdminClient,
  context: CheckoutContext,
  audit: EntitlementAuditInput,
): Promise<FulfillmentResult> {
  const { error } = await supabaseAdmin
    .from("entitlement_audit")
    .insert(entitlementAuditInsert(context, audit));

  if (error) return { kind: "failed", message: `Failed to record entitlement audit: ${supabaseMessage(error)}` };
  return { kind: "fulfilled" };
}

async function updateStripeEventStatus(
  supabaseAdmin: SupabaseAdminClient,
  eventId: string,
  processingStatus: ProcessingStatus,
  errorMessage: string | null,
): Promise<FulfillmentResult> {
  const { error } = await supabaseAdmin
    .from("stripe_events")
    .update(statusUpdate(processingStatus, errorMessage))
    .eq("event_id", eventId);

  if (error) return { kind: "failed", message: `Failed to update Stripe event status: ${supabaseMessage(error)}` };
  return { kind: "fulfilled" };
}
