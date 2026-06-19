import { NextResponse } from "next/server";
import { z } from "zod";
import {
  accountDeletionRequestSchema,
  deleteCoffeeDexAccount,
} from "@/lib/account-deletion";
import {
  AdminSupabaseConfigurationError,
  createAdminSupabase,
} from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const authenticatedUserIdSchema = z.string().uuid();

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { code: status, message } }, { status });
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    const userId = authenticatedUserIdSchema.safeParse(data.user?.id);
    if (error || !userId.success) {
      return errorResponse(401, "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
    }

    const body = await request.json();
    const confirmation = accountDeletionRequestSchema.safeParse(body);
    if (!confirmation.success) {
      return errorResponse(400, "계정 삭제 확인 문구와 영구 삭제 동의가 필요합니다.");
    }

    const admin = createAdminSupabase();
    const result = await deleteCoffeeDexAccount(admin, userId.data);
    if (result.kind === "failed") {
      console.error("CoffeeDex account deletion failed", {
        operation: result.operation,
        userId: userId.data,
      });
      return errorResponse(500, "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요.");
    }

    return NextResponse.json({ data: { status: "deleted" } });
  } catch (error: unknown) {
    if (error instanceof AdminSupabaseConfigurationError) {
      console.error("CoffeeDex account deletion is not configured", { issues: error.issues.length });
      return errorResponse(503, "계정 삭제 서비스를 사용할 수 없습니다.");
    }
    if (error instanceof SyntaxError) {
      return errorResponse(400, "올바른 JSON 요청이 필요합니다.");
    }
    console.error("Unexpected CoffeeDex account deletion failure", error);
    return errorResponse(500, "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요.");
  }
}
