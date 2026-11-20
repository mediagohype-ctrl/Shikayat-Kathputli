"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { STATUSES } from "@/lib/schema";
import { STATUS_LABEL } from "@/lib/format";

const ALL = "all";

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v && v !== ALL) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  const exportParams = new URLSearchParams(sp.toString());
  exportParams.delete("page");
  const hasFilters = ["status", "category", "q", "from", "to"].some((k) => sp.get(k));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || null });
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, house no. or KPC-0001"
          aria-label="Search"
          className="h-10 text-sm"
        />
        <Button type="submit" className="h-10">
          <Search className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Search</span>
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Select value={sp.get("status") ?? ALL} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sp.get("category") ?? ALL} onValueChange={(v) => update({ category: v })}>
          <SelectTrigger aria-label="Category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex flex-col text-xs text-muted">
          From
          <input
            type="date"
            value={sp.get("from") ?? ""}
            onChange={(e) => update({ from: e.target.value || null })}
            className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col text-xs text-muted">
          To
          <input
            type="date"
            value={sp.get("to") ?? ""}
            onChange={(e) => update({ to: e.target.value || null })}
            className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-ink"
          />
        </label>

        <div className="col-span-2 flex items-end gap-2 md:col-span-1">
          {hasFilters && (
            <Button
              variant="secondary"
              className="h-10 flex-1"
              onClick={() => {
                setQ("");
                router.push(pathname);
              }}
            >
              <X className="h-4 w-4" aria-hidden /> Clear
            </Button>
          )}
          <Button asChild variant="outline" className="h-10 flex-1">
            <a href={`/api/admin/export?${exportParams.toString()}`} download>
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
