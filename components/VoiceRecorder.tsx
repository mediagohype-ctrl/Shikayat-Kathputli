"use client";

import { useEffect, useRef, useState } from "react";
import { FileAudio, Mic, Pause, Play, RotateCcw, Square, Trash2 } from "lucide-react";
import { hi } from "@/lib/strings.hi";
import { LIMITS } from "@/lib/schema";
import { cx } from "@/lib/cx";

export type VoiceState = {
  blob: Blob;
  url: string;
  status: "uploading" | "done" | "error";
  progress: number;
  path?: string;
} | null;

type Props = {
  voice: VoiceState;
  onRecorded: (blob: Blob) => void;
  onClear: () => void;
  onRetry: () => void;
  onError: (msg: string) => void;
};

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg"];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((m) => {
    try {
      return MediaRecorder.isTypeSupported(m);
    } catch {
      return false;
    }
  });
}

/** Duration in seconds, or 0 if the browser can't read it (we then rely on the size limit). */
function audioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : 0);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    setTimeout(() => done(0), 3000);
    a.src = url;
  });
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function VoiceRecorder({ voice, onRecorded, onClear, onRetry, onError }: Props) {
  const [mode, setMode] = useState<"idle" | "requesting" | "recording" | "denied" | "unsupported">("idle");
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")) {
      setMode("unsupported");
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recRef.current && recRef.current.state !== "inactive") {
        recRef.current.onstop = null;
        recRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  };

  const start = async () => {
    setMode("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMode("denied");
      return;
    }
    streamRef.current = stream;
    const mime = pickMime();
    let rec: MediaRecorder;
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setMode("unsupported");
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setMode("idle");
      const type = (rec.mimeType || mime || "audio/webm").split(";")[0];
      const blob = new Blob(chunks, { type });
      if (blob.size === 0) return;
      if (blob.size > LIMITS.audio) {
        onError(hi.errors.audioTooBig);
        return;
      }
      onRecorded(blob);
    };
    recRef.current = rec;
    rec.start(1000);
    setSeconds(0);
    setMode("recording");
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setSeconds(s);
      if (s >= LIMITS.maxVoiceSeconds) stop();
    }, 250);
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(m4a|mp3|ogg|opus|aac|wav|amr|webm)$/i.test(file.name)) {
      onError(hi.errors.badFileType);
      return;
    }
    if (file.size > LIMITS.audio) {
      onError(hi.errors.audioTooBig);
      return;
    }
    if ((await audioDuration(file)) > LIMITS.maxVoiceSeconds + 5) {
      onError(hi.errors.audioTooLong);
      return;
    }
    // WhatsApp .opus files often have an empty type.
    const blob = file.type ? file : new Blob([file], { type: "audio/ogg" });
    onRecorded(blob);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="audio/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        void pickFile(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  /* ---- Has a recording ---- */
  if (voice) {
    return (
      <div className="rounded-2xl border-2 border-line bg-white p-4">
        <audio
          ref={audioRef}
          src={voice.url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? hi.voice.pause : hi.voice.play}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-white"
          >
            {playing ? <Pause className="h-8 w-8" aria-hidden /> : <Play className="ml-1 h-8 w-8" aria-hidden />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-success-dark">✓ {hi.step2.voiceAdded}</p>
            {voice.status === "uploading" && (
              <div className="mt-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={voice.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${voice.progress}%` }} />
                </div>
                <p className="text-sm text-muted">{hi.nav.uploading} {voice.progress}%</p>
              </div>
            )}
            {voice.status === "error" && (
              <button type="button" onClick={onRetry} className="mt-1 inline-flex min-h-[44px] items-center gap-1 font-semibold text-danger underline">
                <RotateCcw className="h-4 w-4" aria-hidden /> {hi.step3.retry}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              audioRef.current?.pause();
              onClear();
            }}
            aria-label={hi.voice.reRecord}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-danger text-danger"
          >
            <Trash2 className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  /* ---- Mic not available: file fallback ---- */
  if (mode === "denied" || mode === "unsupported") {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
        <p className="text-lg font-semibold text-amber-900">
          {mode === "denied" ? hi.voice.permissionDenied : hi.voice.notSupported}
        </p>
        <p className="mt-1 text-base text-amber-900">{hi.voice.permissionHelp}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-lg font-semibold text-white"
        >
          <FileAudio className="h-6 w-6" aria-hidden /> {hi.voice.pickAudio}
        </button>
        {mode === "denied" && (
          <button type="button" onClick={start} className="mt-2 min-h-[48px] w-full font-semibold text-primary underline">
            <Mic className="mr-1 inline h-5 w-5" aria-hidden />
            {hi.voice.tapToRecord}
          </button>
        )}
        {fileInput}
      </div>
    );
  }

  /* ---- Idle / recording ---- */
  const recording = mode === "recording";
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-line bg-white p-5 text-center">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={mode === "requesting"}
        aria-label={recording ? hi.voice.stop : hi.voice.tapToRecord}
        className={cx(
          "flex h-24 w-24 items-center justify-center rounded-full text-white shadow-md",
          recording ? "bg-danger" : "bg-primary",
        )}
      >
        {recording ? <Square className="h-10 w-10" fill="currentColor" aria-hidden /> : <Mic className="h-12 w-12" aria-hidden />}
      </button>
      {recording ? (
        <div className="mt-3" aria-live="polite">
          <p className="flex items-center justify-center gap-2 text-2xl font-bold tabular-nums">
            <span className="animate-rec inline-block h-3 w-3 rounded-full bg-danger" aria-hidden />
            {fmt(seconds)} / {fmt(LIMITS.maxVoiceSeconds)}
          </p>
          <p className="text-base text-muted">{hi.voice.recording} — {hi.voice.stop} ⏹</p>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-lg font-semibold">{hi.voice.tapToRecord}</p>
          <p className="text-base text-muted">{hi.voice.maxNote}</p>
        </div>
      )}
      {!recording && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 inline-flex min-h-[48px] items-center gap-1 text-base font-semibold text-primary underline"
        >
          <FileAudio className="h-5 w-5" aria-hidden /> {hi.voice.pickAudio}
        </button>
      )}
      {fileInput}
    </div>
  );
}
