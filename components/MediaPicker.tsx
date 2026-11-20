"use client";

import { useRef } from "react";
import { Camera, Images, Loader2, RotateCcw, Video, X } from "lucide-react";
import { hi } from "@/lib/strings.hi";
import { LIMITS } from "@/lib/schema";
import { cx } from "@/lib/cx";

export type MediaEntry = {
  id: string;
  kind: "image" | "video";
  previewUrl: string;
  file: File;
  status: "compressing" | "uploading" | "done" | "error";
  progress: number;
  path?: string;
  size: number;
};

type Props = {
  items: MediaEntry[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  invalid?: boolean;
  describedBy?: string;
  firstButtonRef?: React.Ref<HTMLButtonElement>;
};

export default function MediaPicker({ items, onAdd, onRemove, onRetry, invalid, describedBy, firstButtonRef }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const full = items.length >= LIMITS.maxMedia;

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onAdd(files);
  };

  const bigBtn =
    "flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-[17px] font-semibold leading-tight disabled:opacity-50";

  return (
    <div aria-describedby={describedBy}>
      <div className="grid grid-cols-2 gap-3">
        <button
          ref={firstButtonRef}
          type="button"
          disabled={full}
          onClick={() => photoRef.current?.click()}
          className={cx(bigBtn, "border-primary bg-primary text-white")}
        >
          <Camera className="h-9 w-9" aria-hidden />
          {hi.step3.photo}
        </button>
        <button
          type="button"
          disabled={full}
          onClick={() => videoRef.current?.click()}
          className={cx(bigBtn, "border-primary bg-primary text-white")}
        >
          <Video className="h-9 w-9" aria-hidden />
          {hi.step3.video}
        </button>
        <button
          type="button"
          disabled={full}
          onClick={() => galleryRef.current?.click()}
          className={cx(
            "col-span-2 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 bg-white text-lg font-semibold text-primary disabled:opacity-50",
            invalid ? "border-danger" : "border-primary",
          )}
        >
          <Images className="h-7 w-7" aria-hidden />
          {hi.step3.gallery}
        </button>
      </div>

      <input ref={photoRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={handle} />
      <input ref={videoRef} type="file" accept="video/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={handle} />
      <input ref={galleryRef} type="file" accept="image/*,video/*" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={handle} />

      {items.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {items.map((m) => (
            <li key={m.id} className="relative aspect-square overflow-hidden rounded-xl border-2 border-line bg-slate-100">
              {m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <video src={`${m.previewUrl}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              )}
              {m.kind === "video" && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-xs font-semibold text-white">
                  <Video className="inline h-3 w-3" aria-hidden /> {hi.step3.videoTag}
                </span>
              )}
              {(m.status === "uploading" || m.status === "compressing") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 px-2 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                  <span className="text-sm font-semibold">{m.status === "compressing" ? "…" : `${m.progress}%`}</span>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30" role="progressbar" aria-valuenow={m.progress} aria-valuemin={0} aria-valuemax={100} aria-label={hi.nav.uploading}>
                    <div className="h-full bg-white transition-[width]" style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
              )}
              {m.status === "error" && (
                <button
                  type="button"
                  onClick={() => onRetry(m.id)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger/80 text-sm font-semibold text-white"
                >
                  <RotateCcw className="h-6 w-6" aria-hidden />
                  {hi.step3.retry}
                </button>
              )}
              {m.status === "done" && (
                <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success-dark text-sm text-white" aria-hidden>
                  ✓
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                aria-label={hi.step3.remove}
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
