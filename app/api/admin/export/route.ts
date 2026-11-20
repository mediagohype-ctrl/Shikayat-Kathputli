import { type NextRequest } from "next/server";
import { listAllComplaints } from "@/lib/admin-queries";
import { complaintsToCsv } from "@/lib/csv";
import { todayIST } from "@/lib/format";
import { parseListQuery } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = parseListQuery(req.nextUrl.searchParams);
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, ...filters } = parsed.data;
  try {
    const rows = await listAllComplaints(filters);
    return new Response(complaintsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="complaints-${todayIST()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
