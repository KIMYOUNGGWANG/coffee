import { z } from "zod";

export const ACCOUNT_DELETION_CONFIRMATION = "내 CoffeeDex 계정을 영구 삭제합니다" as const;

export const accountDeletionRequestSchema = z
  .object({
    confirmation: z.literal(ACCOUNT_DELETION_CONFIRMATION),
    acknowledgePermanentDeletion: z.literal(true),
  })
  .strict()
  .readonly();

type OperationError = {
  readonly message: string;
};

type OperationResult = {
  readonly error: OperationError | null;
};

type FilterableOperation = {
  eq(column: string, value: string): PromiseLike<OperationResult>;
};

type AccountDeletionQuery = {
  update(values: Readonly<Record<string, unknown>>): FilterableOperation;
  delete(): FilterableOperation;
};

export type AccountDeletionAdminClient = {
  from(table: string): AccountDeletionQuery;
  readonly auth: {
    readonly admin: {
      deleteUser(userId: string): Promise<OperationResult>;
    };
  };
};

type DeletionOperation =
  | "privatize_public_cards"
  | "redact_stripe_events"
  | "anonymize_product_events"
  | "delete_brewing_logs"
  | "delete_coffee_shelf_items"
  | "delete_brewing_notes"
  | "delete_tasting_cards"
  | "delete_entitlement_audit"
  | "delete_profile"
  | "delete_auth_identity";

export type AccountDeletionResult =
  | { readonly kind: "deleted" }
  | { readonly kind: "failed"; readonly operation: DeletionOperation; readonly message: string };

const ownedProductTables = [
  ["brewing_logs", "delete_brewing_logs"],
  ["coffee_shelf_items", "delete_coffee_shelf_items"],
  ["brewing_notes", "delete_brewing_notes"],
  ["tasting_cards", "delete_tasting_cards"],
  ["entitlement_audit", "delete_entitlement_audit"],
] as const satisfies readonly (readonly [string, DeletionOperation])[];

function failed(operation: DeletionOperation, error: OperationError): AccountDeletionResult {
  return { kind: "failed", operation, message: error.message };
}

export async function deleteCoffeeDexAccount(
  admin: AccountDeletionAdminClient,
  userId: string,
): Promise<AccountDeletionResult> {
  const privatize = await admin
    .from("tasting_cards")
    .update({ is_public: false })
    .eq("user_id", userId);
  if (privatize.error) return failed("privatize_public_cards", privatize.error);

  const redactStripe = await admin
    .from("stripe_events")
    .update({
      user_id: null,
      stripe_customer_id: null,
      stripe_session_id: null,
      stripe_payment_intent_id: null,
      stripe_subscription_id: null,
      stripe_subscription_item_id: null,
      stripe_invoice_id: null,
      checkout_metadata: {},
      payload: {},
      error_message: null,
    })
    .eq("user_id", userId);
  if (redactStripe.error) return failed("redact_stripe_events", redactStripe.error);

  const anonymizeEvents = await admin
    .from("product_events")
    .update({ user_id: null })
    .eq("user_id", userId);
  if (anonymizeEvents.error) return failed("anonymize_product_events", anonymizeEvents.error);

  for (const [table, operation] of ownedProductTables) {
    const deletion = await admin.from(table).delete().eq("user_id", userId);
    if (deletion.error) return failed(operation, deletion.error);
  }

  const profileDeletion = await admin.from("profiles").delete().eq("id", userId);
  if (profileDeletion.error) return failed("delete_profile", profileDeletion.error);

  const authDeletion = await admin.auth.admin.deleteUser(userId);
  if (authDeletion.error) return failed("delete_auth_identity", authDeletion.error);

  return { kind: "deleted" };
}
