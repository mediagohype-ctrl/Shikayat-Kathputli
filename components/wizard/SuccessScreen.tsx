"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { hi } from "@/lib/strings.hi";

export default function SuccessScreen({ complaintNo, onReset }: { complaintNo: string; onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section className="flex flex-col items-center gap-5 pt-6 text-center" aria-live="polite">
      <CheckCircle2 className="h-28 w-28 text-success" strokeWidth={2.2} aria-hidden />
      <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-tight text-success-dark outline-none">
        {hi.success.title}
      </h1>
      <div className="w-full rounded-2xl border-2 border-success bg-white p-5">
        <p className="text-lg text-muted">{hi.success.numberLabel}</p>
        <p className="mt-1 text-[44px] font-bold tracking-wider text-ink">{complaintNo}</p>
        <p className="text-base text-muted">{hi.success.keepNumber}</p>
      </div>
      <p className="rounded-xl bg-amber-50 p-4 text-[18px] text-amber-900">{hi.success.note}</p>
      <button
        type="button"
        onClick={onReset}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white text-xl font-bold text-primary"
      >
        <RotateCcw className="h-6 w-6" aria-hidden /> {hi.success.again}
      </button>
    </section>
  );
}
