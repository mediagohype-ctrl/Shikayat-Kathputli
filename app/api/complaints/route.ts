import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { complaintPayloadSchema } from "@/lib/schema";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Every path must be YYYY/MM/<uploadId>/<file>. */
function pathBelongs(path: string, uploadId: string): boolean {
  const m = /^\d{4}\/\d{2}\/([0-9a-f-]{36})\/[A-Za-z0-9_-]+\.[a-z0-9]{1,8}$/.exec(path);
  return !!m && m[1] === uploadId;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = complaintPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", fields: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }
  const p = parsed.data;

  // Honeypot: real users never see or fill this. Pretend success to bots.
  if (p.website.trim() !== "") return NextResponse.json({ complaintNo: "KPC-0000" });

  const uploadId = p.uploadId.toLowerCase();
  const allPaths = [...p.media.map((m) => m.path), ...(p.voicePath ? [p.voicePath] : [])];
  if (!allPaths.every((path) => pathBelongs(path, uploadId))) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }
  if (new Set(allPaths).size !== allPaths.length) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  try {
    if (await isRateLimited(p.mobile, ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const { data, error } = await supabaseAdmin()
      .from("complaints")
      .insert({
        name: p.name,
        mobile: p.mobile,
        house_no: p.houseNo,
        categories: Array.from(new Set(p.categories)),
        description: p.description.trim() || null,
        voice_path: p.voicePath ?? null,
        media: p.media,
        ip,
      })
      .select("complaint_no")
      .single();
    if (error || !data) throw error ?? new Error("insert returned no row");
    return NextResponse.json({ complaintNo: data.complaint_no as string });
  } catch (e) {
    console.error("complaint insert failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
