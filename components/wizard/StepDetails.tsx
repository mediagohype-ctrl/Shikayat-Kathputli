"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Home, Phone, UserRound } from "lucide-react";
import { fieldClass } from "@/lib/cx";
import { hi } from "@/lib/strings.hi";
import FieldError from "./FieldError";
import type { WizardValues } from "./ComplaintWizard";

const label = "mb-1.5 flex items-center gap-2 text-[18px] font-semibold";
const input = `${fieldClass} h-14`;

export default function StepDetails({ form }: { form: UseFormReturn<WizardValues> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="step1-title">
      <h2 id="step1-title" className="text-[26px] font-bold leading-tight">
        {hi.step1.title}
      </h2>

      <div>
        <label htmlFor="name" className={label}>
          <UserRound className="h-6 w-6 text-primary" aria-hidden /> {hi.step1.name}
        </label>
        <input
          id="name"
          autoComplete="name"
          placeholder={hi.step1.namePlaceholder}
          maxLength={60}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={input}
          {...register("name")}
        />
        <FieldError id="name-error" message={errors.name?.message} />
      </div>

      <div>
        <label htmlFor="mobile" className={label}>
          <Phone className="h-6 w-6 text-primary" aria-hidden /> {hi.step1.mobile}
        </label>
        <div className="flex">
          <span className="flex h-14 items-center rounded-l-xl border-2 border-r-0 border-line bg-slate-100 px-3 text-[18px] font-semibold text-muted" aria-hidden>
            +91
          </span>
          <Controller
            control={control}
            name="mobile"
            render={({ field }) => (
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={hi.step1.mobilePlaceholder}
                aria-invalid={!!errors.mobile}
                aria-describedby={errors.mobile ? "mobile-error" : undefined}
                className={`${input} rounded-l-none tracking-wider`}
                ref={field.ref}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => {
                  // Keep digits only; drop a pasted +91 / leading 0.
                  let d = e.target.value.replace(/\D/g, "");
                  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
                  if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
                  field.onChange(d.slice(0, 10));
                }}
              />
            )}
          />
        </div>
        <FieldError id="mobile-error" message={errors.mobile?.message} />
      </div>

      <div>
        <label htmlFor="houseNo" className={label}>
          <Home className="h-6 w-6 text-primary" aria-hidden /> {hi.step1.houseNo}
        </label>
        <input
          id="houseNo"
          placeholder={hi.step1.houseNoPlaceholder}
          maxLength={30}
          aria-invalid={!!errors.houseNo}
          aria-describedby={errors.houseNo ? "houseNo-error" : undefined}
          className={input}
          {...register("houseNo")}
        />
        <FieldError id="houseNo-error" message={errors.houseNo?.message} />
      </div>
    </section>
  );
}
