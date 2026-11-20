"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatIST, STATUS_LABEL } from "@/lib/format";
import { STATUSES, type ComplaintStatus } from "@/lib/schema";
import { hi } from "@/lib/strings.hi";

type Props = {
  id: string;
  complaintNo: string;
  mobile: string;
  initialStatus: ComplaintStatus;
  initialNote: string;
  updatedAt: string;
};

export default function ComplaintEditor({ id, complaintNo, mobile, initialStatus, initialNote, updatedAt }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(updatedAt);
  const dirty = status !== initialStatus || note !== initialNote;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: note }),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setLastSaved(data.updated_at);
      toast.success(`Saved · ${complaintNo} is now ${STATUS_LABEL[status]}`);
      router.refresh();
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const waText = encodeURIComponent(hi.whatsappUpdate(complaintNo, status));
  const waHref = `https://wa.me/91${mobile}?text=${waText}`;

  return (
    <Card className="h-fit md:sticky md:top-20">
      <CardHeader>
        <CardTitle>Update progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Status
          <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
            <SelectTrigger aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Admin note
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Internal note (e.g. plumber sent on 21 Nov)"
            className="text-sm font-normal"
          />
        </label>
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Save
        </Button>
        <p className="text-xs text-muted">Last updated {formatIST(lastSaved)}</p>

        <hr className="border-slate-200" />
        <Button asChild variant="success">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden /> Send WhatsApp update
          </a>
        </Button>
        <p className="rounded-lg bg-slate-50 p-2 text-xs text-muted" lang="hi">
          {hi.whatsappUpdate(complaintNo, status)}
        </p>
      </CardContent>
    </Card>
  );
}
