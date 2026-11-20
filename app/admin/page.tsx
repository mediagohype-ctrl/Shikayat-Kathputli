import Link from "next/link";
import { Suspense } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import ComplaintTable from "@/components/admin/ComplaintTable";
import Filters from "@/components/admin/Filters";
import { Button } from "@/components/ui/button";
import { getCounts, listComplaints } from "@/lib/admin-queries";
import { adminListQuerySchema, parseListQuery } from "@/lib/schema";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

function toParams(sp: Record<string, string | string[] | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") p.set(k, v);
  return p;
}

export default async function AdminDashboard({ searchParams }: { searchParams: SP }) {
  const params = toParams(await searchParams);
  const parsed = parseListQuery(params);
  const query = parsed.success ? parsed.data : adminListQuerySchema.parse({});

  let content: React.ReactNode;
  let counts: Awaited<ReturnType<typeof getCounts>> | null = null;
  try {
    const [list, c] = await Promise.all([listComplaints(query), getCounts()]);
    counts = c;
    const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
    const pageHref = (n: number) => {
      const p = new URLSearchParams(params);
      p.set("page", String(n));
      return `/admin?${p.toString()}`;
    };
    content = (
      <>
        <p className="text-sm text-muted">
          {list.total} complaint{list.total === 1 ? "" : "s"} · page {list.page} of {pages}
        </p>
        <ComplaintTable rows={list.rows} />
        {pages > 1 && (
          <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
            {list.page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(list.page - 1)}>← Previous</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                ← Previous
              </Button>
            )}
            <span className="px-2 text-sm">
              {list.page} / {pages}
            </span>
            {list.page < pages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(list.page + 1)}>Next →</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next →
              </Button>
            )}
          </nav>
        )}
      </>
    );
  } catch (e) {
    console.error(e);
    content = (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-danger">
        Could not load complaints. Check the Supabase environment variables and that the migration has been run.
      </p>
    );
  }

  const cards = [
    { label: "Total", value: counts?.total, cls: "text-ink" },
    { label: "New", value: counts?.new, cls: "text-blue-700", href: "/admin?status=new" },
    { label: "In progress", value: counts?.in_progress, cls: "text-amber-700", href: "/admin?status=in_progress" },
    { label: "Resolved", value: counts?.resolved, cls: "text-green-700", href: "/admin?status=resolved" },
    { label: "Today", value: counts?.today, cls: "text-primary" },
  ];

  return (
    <>
      <AdminHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Complaints</h1>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Summary">
          {cards.map((c) => {
            const inner = (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
                <p className={`text-3xl font-bold tabular-nums ${c.cls}`}>{c.value ?? "–"}</p>
              </>
            );
            return c.href ? (
              <Link key={c.label} href={c.href} className="rounded-xl border border-slate-200 bg-white p-3 hover:border-primary">
                {inner}
              </Link>
            ) : (
              <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-3">
                {inner}
              </div>
            );
          })}
        </section>
        <Suspense>
          <Filters />
        </Suspense>
        {content}
      </main>
    </>
  );
}
