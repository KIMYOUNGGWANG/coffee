import { NextResponse } from "next/server";
import { z } from "zod";
import { getErrorMessage } from "@/lib/api-errors";
import { createAdminDataClient, requireAdmin } from "@/lib/admin";
import { AdminSupabaseConfigurationError } from "@/lib/supabase/admin";

const cleanupRequestSchema = z.object({
  confirm: z.literal(true),
}).strict();

type TastingCardCandidate = {
  readonly id: string;
  readonly user_id: string;
  readonly title: string | null;
  readonly subtitle: string | null;
};

type ShelfCandidate = {
  readonly id: string;
  readonly user_id: string;
  readonly roaster_name: string | null;
  readonly bean_name: string | null;
};

type SelectResult<T> = {
  readonly data: readonly T[] | null;
  readonly error: { readonly message: string } | null;
};

type DeleteResult = {
  readonly data: readonly { readonly id: string }[] | null;
  readonly error: { readonly message: string } | null;
};

function responseError(status: number, message: string) {
  return NextResponse.json({ error: { code: status, message } }, { status });
}

function selectResult<T>(result: SelectResult<T>): SelectResult<T> {
  return result;
}

function deleteResult(result: DeleteResult): DeleteResult {
  return result;
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return {};
    }
    throw error;
  }
}

function includesQaMarker(...values: readonly (string | null | undefined)[]): boolean {
  return values.some((value) => /\b(qa|test)\b|테스트|테스트용|qa-|test-/i.test(value ?? ""));
}

async function deleteIds(
  table: string,
  ids: readonly string[],
  deleteRows: (tableName: string, rowIds: readonly string[]) => Promise<DeleteResult>,
): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await deleteRows(table, ids);
  if (result.error) {
    throw new Error(`${table} cleanup failed: ${result.error.message}`);
  }
  return result.data?.length ?? ids.length;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return responseError(admin.status, admin.message);
  }

  try {
    const parsed = cleanupRequestSchema.safeParse(await readBody(request));
    if (!parsed.success) {
      return responseError(400, "QA/test 데이터 정리는 confirm: true 확인이 필요합니다.");
    }

    const supabase = createAdminDataClient();
    const [cardsResult, shelfResult] = await Promise.all([
      supabase
        .from("tasting_cards")
        .select("id,user_id,title,subtitle")
        .order("created_at", { ascending: false })
        .limit(1000)
        .then((result) => selectResult<TastingCardCandidate>(result)),
      supabase
        .from("coffee_shelf_items")
        .select("id,user_id,roaster_name,bean_name")
        .order("created_at", { ascending: false })
        .limit(1000)
        .then((result) => selectResult<ShelfCandidate>(result)),
    ]);

    const firstError = cardsResult.error ?? shelfResult.error;
    if (firstError) {
      return responseError(500, `QA/test 후보 조회를 실패했습니다: ${firstError.message}`);
    }

    const cardIds = (cardsResult.data ?? [])
      .filter((card) => includesQaMarker(card.title, card.subtitle))
      .map((card) => card.id);
    const shelfIds = (shelfResult.data ?? [])
      .filter((item) => includesQaMarker(item.roaster_name, item.bean_name))
      .map((item) => item.id);

    const deleteRows = async (tableName: string, rowIds: readonly string[]): Promise<DeleteResult> => {
      return deleteResult(await supabase
        .from(tableName)
        .delete()
        .in("id", rowIds)
        .select("id"));
    };
    const deleteByShelfId = async (tableName: string, rowIds: readonly string[]): Promise<DeleteResult> => {
      return deleteResult(await supabase
        .from(tableName)
        .delete()
        .in("shelf_item_id", rowIds)
        .select("id"));
    };
    const deleteByCardId = async (tableName: string, rowIds: readonly string[]): Promise<DeleteResult> => {
      return deleteResult(await supabase
        .from(tableName)
        .delete()
        .in("card_id", rowIds)
        .select("id"));
    };

    const deletedBrewingLogs = await deleteIds("brewing_logs", shelfIds, deleteByShelfId);
    const deletedBrewingNotes = await deleteIds("brewing_notes", cardIds, deleteByCardId);
    const deletedShelfItems = await deleteIds("coffee_shelf_items", shelfIds, deleteRows);
    const deletedTastingCards = await deleteIds("tasting_cards", cardIds, deleteRows);

    return NextResponse.json({
      data: {
        deleted: {
          brewingLogs: deletedBrewingLogs,
          brewingNotes: deletedBrewingNotes,
          shelfItems: deletedShelfItems,
          tastingCards: deletedTastingCards,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof AdminSupabaseConfigurationError) {
      return responseError(503, "관리자 서비스롤 설정이 필요합니다.");
    }

    return NextResponse.json(
      { error: { code: 500, message: "QA/test 데이터 정리를 완료하지 못했습니다.", details: getErrorMessage(error) } },
      { status: 500 },
    );
  }
}
