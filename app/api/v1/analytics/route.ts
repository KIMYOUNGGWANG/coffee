import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyticsEventSchema } from "@/lib/analytics-events";
import { readStarterEnv } from "@/lib/env";
import { checkRateLimit, readClientIdentity } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

const analyticsRateLimit = {
  key: "analytics",
  limit: 60,
  windowMs: 60_000,
} as const;

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

async function readAuthenticatedAnalyticsUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    return error || !data.user ? null : data.user.id;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(readClientIdentity(request.headers), analyticsRateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 429, message: "Too many analytics events." } },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } },
    );
  }

  const body = await readAnalyticsBody(request);
  const parsedEvent = analyticsEventSchema.safeParse(body);

  if (!parsedEvent.success) {
    return NextResponse.json(
      { error: { code: 400, message: "Invalid analytics event.", details: parsedEvent.error.format() } },
      { status: 400 },
    );
  }

  const event = parsedEvent.data;
  const userId = await readAuthenticatedAnalyticsUserId();

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
      user_id: userId,
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
