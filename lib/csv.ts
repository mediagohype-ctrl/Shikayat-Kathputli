import { CATEGORY_LABEL } from "./categories";
import { formatIST, STATUS_LABEL } from "./format";
import type { ComplaintRow } from "./schema";

function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Guard against spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV with a UTF-8 BOM so Excel shows Hindi correctly. */
export function complaintsToCsv(rows: ComplaintRow[]): string {
  const header = [
    "Complaint No",
    "Date (IST)",
    "Name",
    "Mobile",
    "House / Camp No",
    "Categories",
    "Description",
    "Voice note",
    "Media files",
    "Status",
    "Admin note",
  ];
  const lines = rows.map((r) =>
    [
      r.complaint_no,
      formatIST(r.created_at),
      r.name,
      r.mobile,
      r.house_no,
      r.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(", "),
      r.description ?? "",
      r.voice_path ? "Yes" : "No",
      Array.isArray(r.media) ? r.media.length : 0,
      STATUS_LABEL[r.status] ?? r.status,
      r.admin_note ?? "",
    ]
      .map(cell)
      .join(","),
  );
  return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n") + "\r\n";
}
