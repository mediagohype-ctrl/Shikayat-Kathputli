"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { SignedMedia } from "@/lib/admin-queries";

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function MediaGallery({ items }: { items: SignedMedia[] }) {
  const [open, setOpen] = useState<SignedMedia | null>(null);
  if (items.length === 0) return <p className="text-muted">No photos or videos.</p>;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((m) => (
          <li key={m.path} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {!m.url ? (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-muted">File missing</div>
            ) : m.type === "image" ? (
              <button type="button" onClick={() => setOpen(m)} className="block aspect-square w-full" aria-label="Open photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="Complaint photo" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ) : (
              <video src={m.url} controls playsInline preload="metadata" className="aspect-square w-full bg-black object-contain" />
            )}
            <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted">
              <span>
                {m.type === "image" ? "Photo" : "Video"} · {sizeLabel(m.size)}
              </span>
              {m.downloadUrl && (
                <a href={m.downloadUrl} className="inline-flex items-center gap-1 font-semibold text-primary" download>
                  <Download className="h-3.5 w-3.5" aria-hidden /> Download
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl bg-black p-2">
          <DialogTitle className="sr-only">Photo</DialogTitle>
          {open?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={open.url} alt="Complaint photo, full size" className="max-h-[85dvh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
