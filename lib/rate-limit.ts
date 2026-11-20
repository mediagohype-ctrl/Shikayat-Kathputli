import "server-only";
import { supabaseAdmin } from "./supabase-server";

export const RATE_LIMITS = { perMobilePerHour: 5, perIpPerHour: 20 };

/** Returns true when the request should be blocked. Counts rows in the DB for the last hour. */
export async function isRateLimited(mobile: string, ip: string | null): Promise<boolean> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const mobileQ = db
    .from("complaints")
    .select("id", { count: "exact", head: true })
    .eq("mobile", mobile)
    .gte("created_at", since);
  const ipQ = ip
    ? db.from("complaints").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since)
    : null;

  const [m, i] = await Promise.all([mobileQ, ipQ]);
  if (m.error) throw m.error;
  if (i?.error) throw i.error;
  return (m.count ?? 0) >= RATE_LIMITS.perMobilePerHour || (i?.count ?? 0) >= RATE_LIMITS.perIpPerHour;
}

export function clientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64) || null;
  return headers.get("x-real-ip")?.slice(0, 64) ?? null;
}
