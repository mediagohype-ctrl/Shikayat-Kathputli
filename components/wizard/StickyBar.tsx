import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { hi } from "@/lib/strings.hi";
import { cx } from "@/lib/cx";

type Props = {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "success";
};

/** Fixed bottom bar so the main action is always under the thumb. */
export default function StickyBar({ onBack, onNext, nextLabel = hi.nav.next, disabled, busy, variant = "primary" }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-[480px] items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[56px] items-center gap-1 rounded-xl px-3 text-lg font-semibold text-primary underline-offset-4 active:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden /> {hi.nav.back}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          aria-busy={busy}
          className={cx(
            "flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xl font-bold text-white disabled:opacity-70",
            variant === "success" ? "bg-success-dark active:bg-success" : "bg-primary active:bg-primary-dark",
          )}
        >
          {busy && <Loader2 className="h-6 w-6 animate-spin" aria-hidden />}
          {nextLabel}
          {!busy && variant === "primary" && <ArrowRight className="h-6 w-6" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
