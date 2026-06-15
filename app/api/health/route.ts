import { NextResponse } from "next/server";
import type { StarterHealthResponse } from "@/lib/contracts";
import { starterServiceName } from "@/lib/contracts";

export async function GET() {
  const payload: StarterHealthResponse = {
    status: "ok",
    service: starterServiceName,
    timestamp: new Date().toISOString(),
    mode: "starter",
  };

  return NextResponse.json(payload);
}
