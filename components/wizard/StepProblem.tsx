"use client";

import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Keyboard, Mic } from "lucide-react";
import CategoryTiles from "@/components/CategoryTiles";
import VoiceRecorder, { type VoiceState } from "@/components/VoiceRecorder";
import { hi } from "@/lib/strings.hi";
import { LIMITS } from "@/lib/schema";
import { cx, fieldClass } from "@/lib/cx";
import FieldError from "./FieldError";
import type { WizardValues } from "./ComplaintWizard";

type Props = {
  form: UseFormReturn<WizardValues>;
  voice: VoiceState;
  onVoiceRecorded: (blob: Blob) => void;
  onVoiceClear: () => void;
  onVoiceRetry: () => void;
  onVoiceError: (msg: string) => void;
};

export default function StepProblem({ form, voice, onVoiceRecorded, onVoiceClear, onVoiceRetry, onVoiceError }: Props) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;
  const [tab, setTab] = useState<"type" | "voice">(voice ? "voice" : "type");
  const description = watch("description") ?? "";
  const descErr = errors.description?.message;

  const tabBtn = (active: boolean) =>
    cx(
      "flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl text-[17px] font-semibold",
      active ? "bg-primary text-white shadow" : "bg-transparent text-ink",
    );

  return (
    <section className="flex flex-col gap-6" aria-labelledby="step2-title">
      <h2 id="step2-title" className="text-[26px] font-bold leading-tight">
        {hi.step2.title}
      </h2>

      <div>
        <p id="cat-label" className="text-[18px] font-semibold">
          {hi.step2.categories}
        </p>
        <p className="mb-3 text-base text-muted">{hi.step2.categoriesHint}</p>
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <CategoryTiles
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.categories}
              labelledBy="cat-label"
              describedBy={errors.categories ? "categories-error" : undefined}
            />
          )}
        />
        <FieldError id="categories-error" message={errors.categories?.message} />
      </div>

      <div>
        <p className="mb-2 text-[18px] font-semibold">{hi.step2.description}</p>
        <div role="tablist" aria-label={hi.step2.description} className="mb-3 flex gap-1 rounded-2xl bg-slate-200 p-1">
          <button type="button" role="tab" id="tab-type" aria-controls="panel-type" aria-selected={tab === "type"} onClick={() => setTab("type")} className={tabBtn(tab === "type")}>
            <Keyboard className="h-6 w-6" aria-hidden /> {hi.step2.typeTab}
            {description.trim() && <span aria-hidden>✓</span>}
          </button>
          <button type="button" role="tab" id="tab-voice" aria-controls="panel-voice" aria-selected={tab === "voice"} onClick={() => setTab("voice")} className={tabBtn(tab === "voice")}>
            <Mic className="h-6 w-6" aria-hidden /> {hi.step2.voiceTab}
            {voice && <span aria-hidden>✓</span>}
          </button>
        </div>

        <div id="panel-type" role="tabpanel" aria-labelledby="tab-type" hidden={tab !== "type"}>
          <textarea
            id="description"
            rows={5}
            maxLength={LIMITS.descriptionMax}
            placeholder={hi.step2.descriptionPlaceholder}
            aria-label={hi.step2.description}
            aria-invalid={!!descErr}
            aria-describedby={descErr ? "description-error" : undefined}
            className={`${fieldClass} min-h-[140px] py-2`}
            {...register("description")}
          />
          <p className="mt-1 text-right text-sm text-muted">
            {description.length} / {LIMITS.descriptionMax}
          </p>
        </div>

        <div id="panel-voice" role="tabpanel" aria-labelledby="tab-voice" hidden={tab !== "voice"}>
          <VoiceRecorder voice={voice} onRecorded={onVoiceRecorded} onClear={onVoiceClear} onRetry={onVoiceRetry} onError={onVoiceError} />
        </div>

        <FieldError id="description-error" message={descErr} />
      </div>
    </section>
  );
}
