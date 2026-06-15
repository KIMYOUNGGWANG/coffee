import { NextResponse } from "next/server";
import type { WorkspaceListResponse } from "@/lib/contracts";
import { starterWorkspaces } from "@/lib/contracts";

export async function GET() {
  const payload: WorkspaceListResponse = {
    data: starterWorkspaces,
  };

  return NextResponse.json(payload);
}
