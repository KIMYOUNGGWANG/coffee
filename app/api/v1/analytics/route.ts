import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyticsEventSchema } from "@/lib/analytics-events";
import { readStarterEnv } from "@/lib/env";

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

  const event = parsedEvent.data;

  try {
    const env = readStarterEnv(process.env);
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    const { error } = await supabaseAdmin.from("product_events").insert({
      event_id: event.eventId,
      event_name: event.eventName,
      occurred_at: event.occurredAt,
      path: event.path,
      user_id: null,
      anonymous_id: event.anonymousId ?? null,
      properties: event.properties,
    });

    if (!error) {
      return NextResponse.json({ received: true });
    }
    if (error.code === "23505") {
      return NextResponse.json({ received: true, idempotent: true });
    }

    console.error("Analytics persistence failed:", error.code);
    return NextResponse.json(
      { error: { code: 500, message: "Analytics event could not be stored." } },
      { status: 500 },
    );
  } catch (error) { // no-excuse-ok: catch
    console.error("Analytics persistence failed:", error);
    return NextResponse.json(
      { error: { code: 500, message: "Analytics event could not be stored." } },
      { status: 500 },
    );
  }
}
