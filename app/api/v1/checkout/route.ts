import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkoutItemTypeSchema, readCheckoutProduct } from "@/lib/commerce";
import { getErrorMessage } from "@/lib/api-errors";
import { readStarterEnv } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import Stripe from "stripe";

const checkoutRequestSchema = z.object({
  itemType: checkoutItemTypeSchema,
});

type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
type CheckoutProduct = ReturnType<typeof readCheckoutProduct>;

async function readCheckoutRequest(request: NextRequest): Promise<CheckoutRequest | null> {
  try {
    const body: unknown = await request.json();
    const parsedRequest = checkoutRequestSchema.safeParse(body);
    return parsedRequest.success ? parsedRequest.data : null;
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

function checkoutLineItem(product: CheckoutProduct): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceData = {
    currency: "usd",
    product_data: {
      name: product.name,
      description: product.description,
    },
    unit_amount: product.amountCents,
  };

  if (product.mode === "subscription") {
    return {
      price_data: {
        ...priceData,
        recurring: { interval: "month" },
      },
      quantity: 1,
    };
  }

  return {
    price_data: priceData,
    quantity: 1,
  };
}

export async function POST(request: NextRequest) {
  try {
    const env = readStarterEnv(process.env);
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요한 서비스입니다." } },
        { status: 401 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: { code: 400, message: "이메일 주소가 없어 결제를 진행할 수 없습니다." } },
        { status: 400 },
      );
    }

    const checkoutRequest = await readCheckoutRequest(request);
    if (!checkoutRequest) {
      return NextResponse.json(
        { error: { code: 400, message: "올바르지 않은 상품 타입입니다." } },
        { status: 400 },
      );
    }

    const selectedProduct = readCheckoutProduct(checkoutRequest.itemType);
    const session = await stripe.checkout.sessions.create({
      mode: selectedProduct.mode,
      line_items: [checkoutLineItem(selectedProduct)],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout_status=success&item_type=${checkoutRequest.itemType}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout_status=cancel`,
      metadata: {
        user_id: user.id,
        item_type: checkoutRequest.itemType,
      },
      subscription_data: selectedProduct.mode === "subscription"
        ? {
            metadata: {
              user_id: user.id,
              item_type: checkoutRequest.itemType,
            },
          }
        : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe session creation failed:", error);
    return NextResponse.json(
      { error: { code: 500, message: "Stripe 결제 세션 생성 중 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 },
    );
  }
}
