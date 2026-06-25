import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import {
  coffeeMemorySchema,
  correctableCoffeeFieldSchema,
  repurchaseIntentSchema,
  repurchaseReasonSchema,
  scanSourceSchema,
} from "@/lib/coffee-memory";
import { z } from "zod";

const packageClaimSchema = z.string().trim().min(1).max(160).nullable();
const cardRowSchema = z.record(z.unknown());

const createCardSchema = z.object({
  category: z.enum(["coffee", "beer", "whiskey", "wine"]),
  title: z.string().min(1, "이름을 입력해주세요."),
  subtitle: z.string().min(1, "로스터리/브랜드를 입력해주세요."),
  imageUrl: z.string().url().nullable().optional(),
  badges: z.array(z.string()).default([]),
  metric1: z.number().int().min(1).max(5), // Coffee: Acidity
  metric2: z.number().int().min(1).max(5), // Coffee: Sweetness
  metric3: z.number().int().min(1).max(5), // Coffee: Body
  metric4: z.number().int().min(1).max(5).default(3), // Coffee: Bitterness
  metric5: z.number().int().min(1).max(5).default(3), // Coffee: Aroma
  metric6: z.number().int().min(1).max(5).default(3), // Coffee: Aftertaste
  tags: z.array(z.string()).default([]),
  aiDescription: z.string().default(""),
  footerMeta: z.object({
    origin: z.string().optional(),
    date: z.string().optional(),
    extraInfo: z.string().optional(),
  }).default({}),
  packageOrigin: packageClaimSchema.optional(),
  packageProcess: packageClaimSchema.optional(),
  repurchaseIntent: repurchaseIntentSchema.optional(),
  repurchaseReasons: z.array(repurchaseReasonSchema).max(8).optional(),
  scanSource: scanSourceSchema.nullable().optional(),
  scanConfidence: z.number().min(0).max(1).nullable().optional(),
  correctedFields: z.array(correctableCoffeeFieldSchema).max(5).optional(),
  confirmed: z.literal(true).optional(),
}).strict().superRefine((value, context) => {
  const hasMemoryInput = value.packageOrigin !== undefined
    || value.packageProcess !== undefined
    || value.repurchaseIntent !== undefined
    || value.repurchaseReasons !== undefined
    || value.scanSource !== undefined
    || value.scanConfidence !== undefined
    || value.correctedFields !== undefined;
  if (hasMemoryInput && value.confirmed !== true) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmed"],
      message: "커피 메모리를 저장하려면 명시적인 확인이 필요합니다.",
    });
  }
});

function withMemoryDefaults(row: unknown) {
  const parsedRow = cardRowSchema.parse(row);
  const memory = coffeeMemorySchema.parse({
    package_origin: parsedRow.package_origin,
    package_process: parsedRow.package_process,
    repurchase_intent: parsedRow.repurchase_intent,
    repurchase_reasons: parsedRow.repurchase_reasons,
    scan_source: parsedRow.scan_source,
    scan_confidence: parsedRow.scan_confidence,
    corrected_fields: parsedRow.corrected_fields,
    confirmed_at: parsedRow.confirmed_at,
  });
  return { ...parsedRow, ...memory };
}

// GET /api/v1/cards - Retrieve tasting cards for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Fetch cards owned by user
    const { data, error } = await supabase
      .from("tasting_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "데이터베이스 조회 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (data ?? []).map(withMemoryDefaults) });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// POST /api/v1/cards - Create a new tasting card
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createCardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Insert new tasting card into Supabase
    const { data, error } = await supabase
      .from("tasting_cards")
      .insert({
        user_id: user.id,
        category: validatedData.category,
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        image_url: validatedData.imageUrl || null,
        badges: validatedData.badges,
        metric1: validatedData.metric1,
        metric2: validatedData.metric2,
        metric3: validatedData.metric3,
        metric4: validatedData.metric4,
        metric5: validatedData.metric5,
        metric6: validatedData.metric6,
        tags: validatedData.tags,
        ai_description: validatedData.aiDescription,
        footer_meta: validatedData.footerMeta,
        package_origin: validatedData.packageOrigin ?? null,
        package_process: validatedData.packageProcess ?? null,
        repurchase_intent: validatedData.repurchaseIntent ?? "undecided",
        repurchase_reasons: validatedData.repurchaseReasons ?? [],
        scan_source: validatedData.scanSource ?? null,
        scan_confidence: validatedData.scanConfidence ?? null,
        corrected_fields: validatedData.correctedFields ?? [],
        confirmed_at: validatedData.confirmed ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "카드를 저장하는 과정에서 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: withMemoryDefaults(data) }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
