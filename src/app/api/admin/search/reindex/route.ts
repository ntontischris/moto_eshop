import { NextRequest, NextResponse } from "next/server";
import { syncProducts } from "@/lib/meilisearch/sync";

const ADMIN_SECRET = process.env.ADMIN_API_SECRET ?? "";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  if (!ADMIN_SECRET || token !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { indexed } = await syncProducts();
    return NextResponse.json({ success: true, indexed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[reindex]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
