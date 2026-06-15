import { NextResponse } from "next/server";
import type { SubscriptionResponse } from "@/lib/contracts";
import { starterSubscription } from "@/lib/contracts";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const profileSubscriptionSchema = z.object({
  is_premium: z.boolean().default(false),
  stripe_subscription_id: z.string().nullable().default(null),
  subscription_status: z
    .enum([
      "inactive",
      "incomplete",
      "incomplete_expired",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "paused",
    ])
    .default("inactive"),
  subscription_current_period_end: z.string().nullable().default(null),
  subscription_cancel_at_period_end: z.boolean().default(false),
  subscription_last_invoice_status: z.string().nullable().default(null),
  subscription_updated_at: z.string().nullable().default(null),
});

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        is_premium,
        stripe_subscription_id,
        subscription_status,
        subscription_current_period_end,
        subscription_cancel_at_period_end,
        subscription_last_invoice_status,
        subscription_updated_at
      `)
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        return NextResponse.json({ data: starterSubscription } satisfies SubscriptionResponse);
      }

      return NextResponse.json(
        { error: { code: 500, message: "구독 상태 조회를 실패했습니다.", details: profileError.message } },
        { status: 500 },
      );
    }

    const parsedProfile = profileSubscriptionSchema.parse(profile);
    return NextResponse.json({
      data: {
        plan: parsedProfile.is_premium ? "premium" : "free",
        status: parsedProfile.subscription_status,
        isPremium: parsedProfile.is_premium,
        stripeSubscriptionId: parsedProfile.stripe_subscription_id,
        currentPeriodEnd: parsedProfile.subscription_current_period_end,
        cancelAtPeriodEnd: parsedProfile.subscription_cancel_at_period_end,
        lastInvoiceStatus: parsedProfile.subscription_last_invoice_status,
        updatedAt: parsedProfile.subscription_updated_at,
      },
    } satisfies SubscriptionResponse);
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details } },
      { status: 500 },
    );
  }
}
