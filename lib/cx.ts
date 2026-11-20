/** Tiny class joiner for the public form (avoids shipping tailwind-merge to residents' phones). */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Shared look for the wizard's text inputs. */
export const fieldClass =
  "block w-full rounded-xl border-2 border-line bg-white px-3 text-[18px] text-ink placeholder:text-slate-500 focus-visible:border-primary focus-visible:outline-none aria-[invalid=true]:border-danger";
