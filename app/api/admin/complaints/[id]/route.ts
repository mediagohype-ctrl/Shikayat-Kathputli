import { NextResponse } from "next/server";
import { z } from "zod";
import { adminPatchSchema } from "@/lib/schema";
import { getComplaintWithUrls } from "@/lib/admin-queries";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const idSchema = z.uuid();

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const result = await getComplaintWithUrls(id);
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const parsed = adminPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.admin_note !== undefined) update.admin_note = parsed.data.admin_note?.trim() || null;

  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .update(update)
    .eq("id", id)
    .select("id, status, admin_note, updated_at")
    .maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}
