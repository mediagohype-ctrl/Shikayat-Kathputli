// Shared formatting helpers (safe for client and server).
const istFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "20 Nov 2026, 4:05 pm" style in IST → normalised to "dd MMM yyyy, h:mm a". */
export function formatIST(iso: string): string {
  const parts = Object.fromEntries(istFormatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toUpperCase()}`;
}

/** Start of the given IST calendar date (yyyy-mm-dd) as a UTC ISO string. */
export function istDayStart(date: string): string {
  return new Date(`${date}T00:00:00+05:30`).toISOString();
}

/** Start of the next IST calendar day after `date`. */
export function istDayEnd(date: string): string {
  return new Date(new Date(`${date}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
