import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, checkPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  if (!(await checkPassword(parsed.data.password))) {
    // Small fixed delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  return res;
}
