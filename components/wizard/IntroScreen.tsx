import { ArrowRight, Camera, ClipboardList, UserRound } from "lucide-react";
import { hi } from "@/lib/strings.hi";

const STEP_ICONS = [UserRound, ClipboardList, Camera];

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex flex-col gap-5 pb-28" aria-labelledby="intro-title">
      <header className="rounded-2xl bg-primary p-5 text-white">
        <h1 id="intro-title" className="text-[28px] font-bold leading-tight">
          {hi.intro.title}
        </h1>
        <p className="mt-2 text-lg text-blue-100">{hi.intro.subtitle}</p>
      </header>

      <p className="text-[18px] text-ink">{hi.intro.description}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-xl font-bold">{hi.intro.stepsTitle}</h2>
        <ol className="flex items-start justify-between gap-2">
          {hi.intro.steps.map((label, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={label} className="flex flex-1 flex-col items-center text-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-8 w-8" aria-hidden />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <span className="mt-2 text-base font-semibold leading-snug">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-[480px]">
          <button
            type="button"
            onClick={onStart}
            className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-xl font-bold text-white active:bg-primary-dark"
          >
            {hi.intro.start} <ArrowRight className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
