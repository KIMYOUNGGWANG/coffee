import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyticsEventSchema } from "@/lib/analytics-events";

async function readAnalyticsBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof Error) {
      return {};
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const body = await readAnalyticsBody(request);
  const parsedEvent = analyticsEventSchema.safeParse(body);

  if (!parsedEvent.success) {
    return NextResponse.json(
      { error: { code: 400, message: "Invalid analytics event.", details: parsedEvent.error.format() } },
      { status: 400 },
    );
  }

  console.info("hyangmi.analytics", parsedEvent.data);
  return NextResponse.json({ received: true });
}
