"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { cx } from "@/lib/cx";

type Props = {
  value: CategoryKey[];
  onChange: (next: CategoryKey[]) => void;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
};

/** Multi-select icon tiles, 2 per row. The forwarded ref lands on the first tile (for focusing on error). */
const CategoryTiles = forwardRef<HTMLButtonElement, Props>(function CategoryTiles(
  { value, onChange, invalid, describedBy, labelledBy },
  ref,
) {
  const toggle = (key: CategoryKey) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="grid grid-cols-2 gap-3"
    >
      {CATEGORIES.map(({ key, label, icon: Icon }, i) => {
        const selected = value.includes(key);
        return (
          <button
            key={key}
            ref={i === 0 ? ref : undefined}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(key)}
            className={cx(
              "relative flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white px-2 py-3 text-center text-[16px] font-semibold leading-snug transition-colors",
              selected
                ? "border-primary bg-primary-soft text-primary-dark"
                : invalid
                  ? "border-danger/60 text-ink"
                  : "border-line text-ink active:bg-slate-50",
            )}
          >
            {selected && (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              </span>
            )}
            <Icon className={cx("h-8 w-8", selected ? "text-primary" : "text-slate-600")} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
});

export default CategoryTiles;
