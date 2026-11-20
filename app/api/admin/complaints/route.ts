import { NextResponse, type NextRequest } from "next/server";
import { parseListQuery } from "@/lib/schema";
import { listComplaints } from "@/lib/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = parseListQuery(req.nextUrl.searchParams);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  try {
    return NextResponse.json(await listComplaints(parsed.data));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
