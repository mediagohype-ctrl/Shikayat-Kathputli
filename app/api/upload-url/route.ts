import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { BUCKET, supabaseAdmin } from "@/lib/supabase-server";
import { LIMITS, extFromMime, mimeMatchesKind, uploadUrlSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = uploadUrlSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { uploadId, kind, mime, size } = parsed.data;
  if (!mimeMatchesKind(mime, kind)) return NextResponse.json({ error: "bad_mime" }, { status: 400 });
  if (size > LIMITS[kind]) return NextResponse.json({ error: "too_large" }, { status: 400 });

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const name = kind === "audio" ? `voice-${randomUUID().slice(0, 8)}` : randomUUID();
  const path = `${yyyy}/${mm}/${uploadId.toLowerCase()}/${name}.${extFromMime(mime)}`;

  try {
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("no data");
    return NextResponse.json({ path: data.path, token: data.token, signedUrl: data.signedUrl });
  } catch (e) {
    console.error("upload-url failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
