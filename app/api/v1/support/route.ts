import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supportCategoryLabel, supportRequestSchema } from "@/lib/support";

async function readSupportBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof Error) return {};
    throw error;
  }
}

function buildTicketId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `hyangmi-support-${datePart}-${randomUUID().slice(0, 8)}`;
}

export async function POST(request: NextRequest) {
  const body = await readSupportBody(request);
  const parsedRequest = supportRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: { code: 400, message: "지원 요청 형식이 올바르지 않습니다.", details: parsedRequest.error.format() } },
      { status: 400 },
    );
  }

  const ticketId = buildTicketId();
  console.info("hyangmi.support_ticket", {
    ticketId,
    category: parsedRequest.data.category,
    categoryLabel: supportCategoryLabel(parsedRequest.data.category),
    email: parsedRequest.data.email,
    checkoutSessionId: parsedRequest.data.checkoutSessionId ?? null,
    subscriptionId: parsedRequest.data.subscriptionId ?? null,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    data: {
      ticketId,
    },
  });
}
