import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/format";

const VARIANT = { new: "blue", in_progress: "amber", resolved: "green", rejected: "grey" } as const;

export default function StatusBadge({ status }: { status: string }) {
  const variant = VARIANT[status as keyof typeof VARIANT] ?? "default";
  return <Badge variant={variant}>{STATUS_LABEL[status] ?? status}</Badge>;
}
