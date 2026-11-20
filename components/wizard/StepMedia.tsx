"use client";

import MediaPicker, { type MediaEntry } from "@/components/MediaPicker";
import { CATEGORY_LABEL } from "@/lib/categories";
import { hi } from "@/lib/strings.hi";
import FieldError from "./FieldError";
import type { WizardValues } from "./ComplaintWizard";

type Props = {
  values: WizardValues;
  hasVoice: boolean;
  media: MediaEntry[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  error?: string;
  firstButtonRef?: React.Ref<HTMLButtonElement>;
};

export default function StepMedia({ values, hasVoice, media, onAdd, onRemove, onRetry, error, firstButtonRef }: Props) {
  const done = media.filter((m) => m.status === "done").length;
  return (
    <section className="flex flex-col gap-6" aria-labelledby="step3-title">
      <div>
        <h2 id="step3-title" className="text-[26px] font-bold leading-tight">
          {hi.step3.title}
        </h2>
        <p className="mt-1 text-[18px] font-semibold">{hi.step3.label}</p>
        <p className="text-base text-muted">{hi.step3.hint}</p>
      </div>

      <div>
        <MediaPicker
          items={media}
          onAdd={onAdd}
          onRemove={onRemove}
          onRetry={onRetry}
          invalid={!!error}
          describedBy={error ? "media-error" : undefined}
          firstButtonRef={firstButtonRef}
        />
        <FieldError id="media-error" message={error} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-xl font-bold">{hi.step3.summary}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[17px]">
          <dt className="text-muted">{hi.step1.name}</dt>
          <dd className="font-semibold break-words">{values.name}</dd>
          <dt className="text-muted">{hi.step1.mobile}</dt>
          <dd className="font-semibold">+91 {values.mobile}</dd>
          <dt className="text-muted">{hi.step1.houseNo}</dt>
          <dd className="font-semibold break-words">{values.houseNo}</dd>
          <dt className="text-muted">{hi.step3.summaryProblem}</dt>
          <dd className="font-semibold">{values.categories.map((c) => CATEGORY_LABEL[c]).join(", ")}</dd>
          {values.description.trim() && (
            <>
              <dt className="text-muted">{hi.step3.summaryDescription}</dt>
              <dd className="line-clamp-3 break-words">{values.description}</dd>
            </>
          )}
          {hasVoice && (
            <>
              <dt className="text-muted">🎤</dt>
              <dd>{hi.step3.voiceYes}</dd>
            </>
          )}
          <dt className="text-muted">📷</dt>
          <dd>{hi.step3.files(done)}</dd>
        </dl>
      </div>
    </section>
  );
}
