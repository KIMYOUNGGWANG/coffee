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

const updateCardSchema = z.object({
  title: z.string().min(1, "이름을 입력해주세요.").optional(),
  subtitle: z.string().min(1, "로스터리/브랜드를 입력해주세요.").optional(),
  imageUrl: z.string().url().nullable().optional(),
  badges: z.array(z.string()).optional(),
  metric1: z.number().int().min(1).max(5).optional(),
  metric2: z.number().int().min(1).max(5).optional(),
  metric3: z.number().int().min(1).max(5).optional(),
  metric4: z.number().int().min(1).max(5).optional(),
  metric5: z.number().int().min(1).max(5).optional(),
  metric6: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  aiDescription: z.string().optional(),
  footerMeta: z.object({
    origin: z.string().optional(),
    date: z.string().optional(),
    extraInfo: z.string().optional(),
  }).optional(),
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

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type CardFooterMeta = {
  origin?: string;
  date?: string;
  extraInfo?: string;
};

type UpdateCardPayload = {
  title?: string;
  subtitle?: string;
  image_url?: string | null;
  badges?: string[];
  metric1?: number;
  metric2?: number;
  metric3?: number;
  metric4?: number;
  metric5?: number;
  metric6?: number;
  tags?: string[];
  ai_description?: string;
  footer_meta?: CardFooterMeta;
  package_origin?: string | null;
  package_process?: string | null;
  repurchase_intent?: "again" | "maybe" | "no" | "undecided";
  repurchase_reasons?: string[];
  scan_source?: "gemini" | "manual" | null;
  scan_confidence?: number | null;
  corrected_fields?: ("title" | "subtitle" | "package_origin" | "package_process" | "tags")[];
  confirmed_at?: string;
};

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

// GET /api/v1/cards/:id - Retrieve a single tasting card
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Retrieve the card. RLS will automatically ensure the user owns this card.
    const { data, error } = await supabase
      .from("tasting_cards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "카드를 찾을 수 없거나 접근 권한이 없습니다." } },
        { status: 404 }
      );
    }

    const cardData = withMemoryDefaults(data);
    return NextResponse.json({ data: { ...cardData, matchScore: 87 } });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/cards/:id - Update a tasting card
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const result = updateCardSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Prepare update object matching DB snake_case naming
    const updatePayload: UpdateCardPayload = {};
    if (validatedData.title !== undefined) updatePayload.title = validatedData.title;
    if (validatedData.subtitle !== undefined) updatePayload.subtitle = validatedData.subtitle;
    if (validatedData.imageUrl !== undefined) updatePayload.image_url = validatedData.imageUrl;
    if (validatedData.badges !== undefined) updatePayload.badges = validatedData.badges;
    if (validatedData.metric1 !== undefined) updatePayload.metric1 = validatedData.metric1;
    if (validatedData.metric2 !== undefined) updatePayload.metric2 = validatedData.metric2;
    if (validatedData.metric3 !== undefined) updatePayload.metric3 = validatedData.metric3;
    if (validatedData.metric4 !== undefined) updatePayload.metric4 = validatedData.metric4;
    if (validatedData.metric5 !== undefined) updatePayload.metric5 = validatedData.metric5;
    if (validatedData.metric6 !== undefined) updatePayload.metric6 = validatedData.metric6;
    if (validatedData.tags !== undefined) updatePayload.tags = validatedData.tags;
    if (validatedData.aiDescription !== undefined) updatePayload.ai_description = validatedData.aiDescription;
    if (validatedData.footerMeta !== undefined) updatePayload.footer_meta = validatedData.footerMeta;
    if (validatedData.packageOrigin !== undefined) updatePayload.package_origin = validatedData.packageOrigin;
    if (validatedData.packageProcess !== undefined) updatePayload.package_process = validatedData.packageProcess;
    if (validatedData.repurchaseIntent !== undefined) updatePayload.repurchase_intent = validatedData.repurchaseIntent;
    if (validatedData.repurchaseReasons !== undefined) updatePayload.repurchase_reasons = [...validatedData.repurchaseReasons];
    if (validatedData.scanSource !== undefined) updatePayload.scan_source = validatedData.scanSource;
    if (validatedData.scanConfidence !== undefined) updatePayload.scan_confidence = validatedData.scanConfidence;
    if (validatedData.correctedFields !== undefined) updatePayload.corrected_fields = [...validatedData.correctedFields];
    if (validatedData.confirmed) updatePayload.confirmed_at = new Date().toISOString();

    // Perform update. RLS ensures only owner updates.
    const { data, error } = await supabase
      .from("tasting_cards")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id) // Extra safety check alongside RLS
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "카드를 수정할 수 없습니다. 권한이 없거나 카드가 존재하지 않습니다." } },
        { status: 404 }
      );
    }

    const cardData = withMemoryDefaults(data);
    return NextResponse.json({ data: { ...cardData, matchScore: 87 } });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/cards/:id - Delete a tasting card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Perform deletion
    const { error } = await supabase
      .from("tasting_cards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Extra safety check alongside RLS

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "카드를 삭제하는 과정에서 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "카드가 성공적으로 삭제되었습니다." }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
