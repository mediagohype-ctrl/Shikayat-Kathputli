"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import { API_ERROR_HI, hi } from "@/lib/strings.hi";
import { LIMITS, step3Schema, wizardSchema } from "@/lib/schema";
import { UploadError, compressImage, newUploadId, uploadFile } from "@/lib/upload";
import type { MediaEntry } from "@/components/MediaPicker";
import type { VoiceState } from "@/components/VoiceRecorder";
import IntroScreen from "./IntroScreen";
import ProgressBar from "./ProgressBar";
import StepDetails from "./StepDetails";
import StepProblem from "./StepProblem";
import StepMedia from "./StepMedia";
import SuccessScreen from "./SuccessScreen";
import StickyBar from "./StickyBar";

export type WizardValues = {
  name: string;
  mobile: string;
  houseNo: string;
  categories: CategoryKey[];
  description: string;
  hasVoice: boolean;
  website: string; // honeypot
};

type Screen = "intro" | 1 | 2 | 3 | "success";

const DRAFT_KEY = "kpc-draft-v1";
const EMPTY: WizardValues = { name: "", mobile: "", houseNo: "", categories: [], description: "", hasVoice: false, website: "" };
const STEP_FIELDS: Record<1 | 2, (keyof WizardValues)[]> = {
  1: ["name", "mobile", "houseNo"],
  2: ["categories", "description"],
};

function uploadErrorMessage(e: unknown): string {
  if (e instanceof UploadError) {
    if (e.code === "network") return hi.errors.network;
    if (API_ERROR_HI[e.code]) return API_ERROR_HI[e.code];
  }
  return hi.errors.uploadFailed;
}

function loadDraft(): Partial<WizardValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    return {
      name: str(d.name, 60),
      mobile: str(d.mobile, 10).replace(/\D/g, ""),
      houseNo: str(d.houseNo, 30),
      description: str(d.description, LIMITS.descriptionMax),
      categories: Array.isArray(d.categories)
        ? (d.categories.filter((c) => (CATEGORY_KEYS as readonly string[]).includes(c as string)) as CategoryKey[])
        : [],
    };
  } catch {
    return null;
  }
}

export default function ComplaintWizard() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [uploadId, setUploadId] = useState<string>(() => newUploadId());
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [mediaError, setMediaError] = useState<string>();
  const [voice, setVoice] = useState<VoiceState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complaintNo, setComplaintNo] = useState("");

  const controllers = useRef(new Map<string, AbortController>());
  const voiceCtrl = useRef<AbortController | null>(null);
  const attempted = useRef<Record<number, boolean>>({});
  const mediaBtnRef = useRef<HTMLButtonElement>(null);
  const mediaRef = useRef(media);
  mediaRef.current = media;

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: EMPTY,
    mode: "onSubmit",
    shouldFocusError: false,
  });
  const { trigger, setValue, getValues, setFocus, reset, watch } = form;

  /* ---------- Draft: restore once, then save on every change ---------- */
  useEffect(() => {
    const d = loadDraft();
    if (d) reset({ ...EMPTY, ...d });
  }, [reset]);

  useEffect(() => {
    const sub = watch((v) => {
      try {
        const { name, mobile, houseNo, categories, description } = v;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, mobile, houseNo, categories, description }));
      } catch {
        /* storage full / private mode */
      }
      // After a failed "Next", re-check the step live so errors disappear as soon as they're fixed.
      if ((screen === 1 || screen === 2) && attempted.current[screen]) void trigger(STEP_FIELDS[screen]);
    });
    return () => sub.unsubscribe();
  }, [watch, trigger, screen]);

  /* ---------- Revoke object URLs on unmount ---------- */
  useEffect(
    () => () => {
      mediaRef.current.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      controllers.current.forEach((c) => c.abort());
    },
    [],
  );

  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  const focusFirstError = (fields: (keyof WizardValues)[]) => {
    const first = fields.find((f) => form.getFieldState(f).invalid);
    if (!first) return;
    // Wait a tick so the error messages are rendered before scrolling to them.
    setTimeout(() => {
      document.getElementById(`${first}-error`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        setFocus(first);
      } catch {
        /* hidden field */
      }
    }, 50);
  };

  const next = async (step: 1 | 2) => {
    attempted.current[step] = true;
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return focusFirstError(STEP_FIELDS[step]);
    go(step === 1 ? 2 : 3);
  };

  /* ---------- Voice ---------- */
  const uploadVoice = useCallback(
    async (blob: Blob, url: string) => {
      voiceCtrl.current?.abort();
      const ctrl = new AbortController();
      voiceCtrl.current = ctrl;
      setVoice({ blob, url, status: "uploading", progress: 0 });
      try {
        const path = await uploadFile({
          uploadId,
          kind: "audio",
          file: blob,
          signal: ctrl.signal,
          onProgress: (p) => !ctrl.signal.aborted && setVoice((v) => (v && v.url === url ? { ...v, progress: p } : v)),
        });
        if (!ctrl.signal.aborted) setVoice((v) => (v && v.url === url ? { ...v, status: "done", progress: 100, path } : v));
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setVoice((v) => (v && v.url === url ? { ...v, status: "error" } : v));
        toast.error(uploadErrorMessage(e));
      }
    },
    [uploadId],
  );

  const onVoiceRecorded = (blob: Blob) => {
    if (voice) URL.revokeObjectURL(voice.url);
    const url = URL.createObjectURL(blob);
    setValue("hasVoice", true, { shouldDirty: true });
    void uploadVoice(blob, url);
  };

  const onVoiceClear = () => {
    voiceCtrl.current?.abort();
    if (voice) URL.revokeObjectURL(voice.url);
    setVoice(null);
    setValue("hasVoice", false, { shouldDirty: true });
  };

  const onVoiceRetry = () => {
    if (voice) void uploadVoice(voice.blob, voice.url);
  };

  /* ---------- Media ---------- */
  const patchMedia = (id: string, patch: Partial<MediaEntry>) =>
    setMedia((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const startUpload = async (id: string, kind: "image" | "video", file: File) => {
    const ctrl = new AbortController();
    controllers.current.set(id, ctrl);
    patchMedia(id, { status: "uploading", progress: 0, file, size: file.size });
    try {
      const path = await uploadFile({
        uploadId,
        kind,
        file,
        signal: ctrl.signal,
        onProgress: (p) => !ctrl.signal.aborted && patchMedia(id, { progress: p }),
      });
      if (!ctrl.signal.aborted) patchMedia(id, { status: "done", progress: 100, path });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      patchMedia(id, { status: "error" });
      toast.error(uploadErrorMessage(e));
    } finally {
      controllers.current.delete(id);
    }
  };

  const removeMedia = (id: string) => {
    controllers.current.get(id)?.abort();
    setMedia((ms) => {
      const m = ms.find((x) => x.id === id);
      if (m) URL.revokeObjectURL(m.previewUrl);
      return ms.filter((x) => x.id !== id);
    });
  };

  const addMedia = (files: File[]) => {
    setMediaError(undefined);
    const room = LIMITS.maxMedia - mediaRef.current.length;
    if (files.length > room) toast.error(hi.errors.mediaMax);
    for (const file of files.slice(0, Math.max(0, room))) {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
      if (!kind) {
        toast.error(hi.errors.badFileType);
        continue;
      }
      if (kind === "video" && file.size > LIMITS.video) {
        toast.error(hi.errors.videoTooBig);
        continue;
      }
      if (kind === "image" && file.size > LIMITS.video) {
        toast.error(hi.errors.photoTooBig);
        continue;
      }
      const id = newUploadId();
      const entry: MediaEntry = {
        id,
        kind,
        file,
        previewUrl: URL.createObjectURL(file),
        status: kind === "image" ? "compressing" : "uploading",
        progress: 0,
        size: file.size,
      };
      setMedia((ms) => [...ms, entry]);
      void (async () => {
        let toSend = file;
        if (kind === "image") {
          toSend = await compressImage(file);
          if (toSend.size > LIMITS.image) {
            toast.error(hi.errors.photoTooBig);
            removeMedia(id);
            return;
          }
          // Removed while compressing?
          if (!mediaRef.current.some((m) => m.id === id)) return;
        }
        await startUpload(id, kind, toSend);
      })();
    }
  };

  const retryMedia = (id: string) => {
    const m = mediaRef.current.find((x) => x.id === id);
    if (m) void startUpload(id, m.kind, m.file);
  };

  /* ---------- Submit ---------- */
  const uploading =
    media.some((m) => m.status === "uploading" || m.status === "compressing") || voice?.status === "uploading";

  const submit = async () => {
    if (uploading || submitting) return;
    const done = media.filter((m) => m.status === "done" && m.path);
    if (media.some((m) => m.status === "error") || voice?.status === "error") {
      setMediaError(hi.step3.removeFailed);
      if (voice?.status === "error") toast.error(hi.errors.uploadFailed);
      return;
    }
    const check = step3Schema.safeParse({
      media: done.map((m) => ({ path: m.path!, type: m.kind, size: m.size })),
    });
    if (!check.success) {
      setMediaError(check.error.issues[0]?.message ?? hi.errors.media);
      requestAnimationFrame(() => {
        document.getElementById("media-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
        mediaBtnRef.current?.focus();
      });
      return;
    }
    // Steps 1–2 should already be valid, but re-check in case the draft was edited.
    if (!(await trigger([...STEP_FIELDS[1], ...STEP_FIELDS[2]]))) {
      const s1 = STEP_FIELDS[1].some((f) => form.getFieldState(f).invalid);
      attempted.current[s1 ? 1 : 2] = true;
      go(s1 ? 1 : 2);
      return;
    }

    const v = getValues();
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          name: v.name.trim(),
          mobile: v.mobile,
          houseNo: v.houseNo.trim(),
          categories: v.categories,
          description: v.description.trim(),
          voicePath: voice?.status === "done" ? voice.path : null,
          media: check.data.media,
          website: v.website,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(API_ERROR_HI[json.error as string] ?? hi.errors.server);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setComplaintNo(json.complaintNo as string);
      go("success");
    } catch {
      toast.error(hi.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    if (voice) URL.revokeObjectURL(voice.url);
    setMedia([]);
    setVoice(null);
    setMediaError(undefined);
    setComplaintNo("");
    attempted.current = {};
    reset(EMPTY);
    setUploadId(newUploadId());
    go(1);
  };

  /* ---------- Render ---------- */
  const values = watch();

  return (
    <main className="mx-auto w-full max-w-[480px] px-4 pb-32 pt-5 text-[18px]">
      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
      </div>

      {screen === "intro" && <IntroScreen onStart={() => go(1)} />}

      {typeof screen === "number" && <ProgressBar step={screen} total={3} />}

      {screen === 1 && (
        <>
          <StepDetails form={form} />
          <StickyBar onBack={() => go("intro")} onNext={() => next(1)} />
        </>
      )}

      {screen === 2 && (
        <>
          <StepProblem
            form={form}
            voice={voice}
            onVoiceRecorded={onVoiceRecorded}
            onVoiceClear={onVoiceClear}
            onVoiceRetry={onVoiceRetry}
            onVoiceError={(msg) => toast.error(msg)}
          />
          <StickyBar onBack={() => go(1)} onNext={() => next(2)} />
        </>
      )}

      {screen === 3 && (
        <>
          <StepMedia
            values={values}
            hasVoice={!!voice}
            media={media}
            onAdd={addMedia}
            onRemove={removeMedia}
            onRetry={retryMedia}
            error={mediaError}
            firstButtonRef={mediaBtnRef}
          />
          <StickyBar
            onBack={() => go(2)}
            onNext={submit}
            variant="success"
            disabled={uploading || submitting}
            busy={uploading || submitting}
            nextLabel={uploading ? hi.nav.uploading : submitting ? hi.nav.submitting : hi.nav.submit}
          />
        </>
      )}

      {screen === "success" && <SuccessScreen complaintNo={complaintNo} onReset={startOver} />}
    </main>
  );
}
