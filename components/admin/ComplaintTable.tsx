import Link from "next/link";
import { Camera, Mic, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_LABEL } from "@/lib/categories";
import { formatIST } from "@/lib/format";
import type { ComplaintRow } from "@/lib/schema";
import StatusBadge from "./StatusBadge";

function Categories({ keys }: { keys: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {keys.map((k) => (
        <Badge key={k} variant="outline">
          {CATEGORY_LABEL[k] ?? k}
        </Badge>
      ))}
    </div>
  );
}

function Attachments({ row }: { row: ComplaintRow }) {
  const n = Array.isArray(row.media) ? row.media.length : 0;
  return (
    <span className="inline-flex items-center gap-2 text-slate-600">
      {row.voice_path && <Mic className="h-4 w-4" aria-label="Voice note" />}
      {n > 0 && (
        <span className="inline-flex items-center gap-0.5" aria-label={`${n} media files`}>
          <Camera className="h-4 w-4" aria-hidden />
          {n}
        </span>
      )}
    </span>
  );
}

export default function ComplaintTable({ rows }: { rows: ComplaintRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-muted">No complaints found.</p>;
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Date (IST)</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>House no.</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold">
                  <Link href={`/admin/complaints/${r.id}`} className="text-primary hover:underline">
                    {r.complaint_no}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatIST(r.created_at)}</TableCell>
                <TableCell className="max-w-[160px] truncate">{r.name}</TableCell>
                <TableCell className="max-w-[120px] truncate">{r.house_no}</TableCell>
                <TableCell>
                  <a href={`tel:+91${r.mobile}`} className="whitespace-nowrap text-primary hover:underline">
                    {r.mobile}
                  </a>
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <Categories keys={r.categories} />
                </TableCell>
                <TableCell>
                  <Attachments row={r} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/admin/complaints/${r.id}`} className="text-lg font-bold text-primary">
                {r.complaint_no}
              </Link>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-xs text-muted">{formatIST(r.created_at)}</p>
            <p className="mt-1 font-semibold">
              {r.name} · <span className="font-normal">{r.house_no}</span>
            </p>
            <div className="mt-1 flex items-center justify-between">
              <a href={`tel:+91${r.mobile}`} className="inline-flex items-center gap-1 text-primary">
                <Phone className="h-4 w-4" aria-hidden /> {r.mobile}
              </a>
              <Attachments row={r} />
            </div>
            <div className="mt-2">
              <Categories keys={r.categories} />
            </div>
            <Link href={`/admin/complaints/${r.id}`} className="mt-2 block text-right text-sm font-semibold text-primary">
              Open →
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
