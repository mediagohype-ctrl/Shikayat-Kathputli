import "server-only";
import { supabaseAdmin, BUCKET } from "./supabase-server";
import { istDayEnd, istDayStart, todayIST } from "./format";
import type { AdminListQuery, ComplaintRow } from "./schema";

export const PAGE_SIZE = 20;

type Filters = Omit<AdminListQuery, "page">;

type Filterable<Q> = {
  eq(col: string, v: unknown): Q;
  contains(col: string, v: string[]): Q;
  gte(col: string, v: string): Q;
  lt(col: string, v: string): Q;
  or(filters: string): Q;
};

function applyFilters<Q extends Filterable<Q>>(query: Q, f: Filters): Q {
  let q = query;
  if (f.status) q = q.eq("status", f.status);
  if (f.category) q = q.contains("categories", [f.category]);
  if (f.from) q = q.gte("created_at", istDayStart(f.from));
  if (f.to) q = q.lt("created_at", istDayEnd(f.to));
  if (f.q) {
    // Strip characters that have meaning in PostgREST filter syntax.
    const term = f.q.replace(/[,()%*\\"':]/g, " ").trim();
    if (term) {
      const like = `%${term}%`;
      q = q.or(
        [`name.ilike.${like}`, `mobile.ilike.${like}`, `house_no.ilike.${like}`, `complaint_no.ilike.${like}`].join(","),
      );
    }
  }
  return q;
}

export async function listComplaints(params: AdminListQuery) {
  const { page, ...filters } = params;
  const fromIdx = (page - 1) * PAGE_SIZE;
  const base = supabaseAdmin().from("complaints").select("*", { count: "exact" });
  const { data, count, error } = await applyFilters(base, filters)
    .order("created_at", { ascending: false })
    .range(fromIdx, fromIdx + PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: (data ?? []) as ComplaintRow[], total: count ?? 0, page, pageSize: PAGE_SIZE };
}

/** All rows matching filters (for CSV export), fetched in chunks. */
export async function listAllComplaints(filters: Filters, cap = 10000): Promise<ComplaintRow[]> {
  const out: ComplaintRow[] = [];
  const chunk = 1000;
  for (let start = 0; start < cap; start += chunk) {
    const base = supabaseAdmin().from("complaints").select("*");
    const { data, error } = await applyFilters(base, filters)
      .order("created_at", { ascending: false })
      .range(start, start + chunk - 1);
    if (error) throw error;
    out.push(...((data ?? []) as ComplaintRow[]));
    if (!data || data.length < chunk) break;
  }
  return out;
}

export async function getCounts() {
  const db = supabaseAdmin();
  const head = () => db.from("complaints").select("id", { count: "exact", head: true });
  const results = await Promise.all([
    head(),
    head().eq("status", "new"),
    head().eq("status", "in_progress"),
    head().eq("status", "resolved"),
    head().gte("created_at", istDayStart(todayIST())),
  ]);
  for (const r of results) if (r.error) throw r.error;
  const [total, fresh, prog, resolved, today] = results.map((r) => r.count ?? 0);
  return { total, new: fresh, in_progress: prog, resolved, today };
}

export type SignedFile = { url: string | null; downloadUrl: string | null };
export type SignedMedia = { path: string; type: "image" | "video"; size: number } & SignedFile;

export async function getComplaintWithUrls(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("complaints").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ComplaintRow;
  const storage = db.storage.from(BUCKET);
  const media = Array.isArray(row.media) ? row.media : [];
  const paths = [...media.map((m) => m.path), ...(row.voice_path ? [row.voice_path] : [])];

  const urls = new Map<string, SignedFile>();
  await Promise.all(
    paths.map(async (p) => {
      const name = p.split("/").pop() ?? "file";
      const [view, dl] = await Promise.all([
        storage.createSignedUrl(p, 3600),
        storage.createSignedUrl(p, 3600, { download: `${row.complaint_no}-${name}` }),
      ]);
      urls.set(p, { url: view.data?.signedUrl ?? null, downloadUrl: dl.data?.signedUrl ?? null });
    }),
  );

  const empty: SignedFile = { url: null, downloadUrl: null };
  const signedMedia: SignedMedia[] = media.map((m) => ({ ...m, ...(urls.get(m.path) ?? empty) }));
  const voice = row.voice_path ? (urls.get(row.voice_path) ?? empty) : null;
  return { complaint: row, media: signedMedia, voice };
}
