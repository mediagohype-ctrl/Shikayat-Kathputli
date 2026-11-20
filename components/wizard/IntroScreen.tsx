import { ArrowRight } from "lucide-react";
import { hi } from "@/lib/strings.hi";

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex flex-col gap-5 pb-28" aria-labelledby="intro-title">
      <header className="rounded-2xl bg-primary p-5 text-white">
        <h1 id="intro-title" className="text-[28px] font-bold leading-tight">
          {hi.intro.title}
        </h1>
        <p className="mt-2 text-lg font-bold text-white">{hi.intro.subtitle}</p>
      </header>

      <p className="text-[18px] font-bold text-ink">{hi.intro.description}</p>

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
