import { hi } from "@/lib/strings.hi";

export default function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center justify-between text-base font-semibold text-primary">
        <span>{hi.progress(step, total)}</span>
        <span className="text-muted">{hi.intro.steps[step - 1]}</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={hi.progress(step, total)}
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
