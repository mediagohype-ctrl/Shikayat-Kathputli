// Browser-side upload helpers: get a signed upload URL from our API, then send the file
// straight to Supabase Storage (bypasses Vercel's request body limit) with progress events.
import type { UploadKind } from "./schema";

export class UploadError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

type SignedUpload = { path: string; token: string; signedUrl: string };

async function requestUploadUrl(uploadId: string, kind: UploadKind, mime: string, size: number): Promise<SignedUpload> {
  let res: Response;
  try {
    res = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, kind, mime, size }),
    });
  } catch {
    throw new UploadError("network");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new UploadError(json.error ?? "server_error");
  return json as SignedUpload;
}

function putWithProgress(
  url: string,
  file: Blob,
  mime: string,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) xhr.setRequestHeader("apikey", anon);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else reject(new UploadError(`storage_${xhr.status}`));
    };
    xhr.onerror = () => reject(new UploadError("network"));
    xhr.onabort = () => reject(new UploadError("aborted"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** Uploads one file and resolves with its storage path. */
export async function uploadFile(opts: {
  uploadId: string;
  kind: UploadKind;
  file: Blob;
  onProgress: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { uploadId, kind, file, onProgress, signal } = opts;
  const mime = file.type || (kind === "audio" ? "audio/webm" : kind === "video" ? "video/mp4" : "image/jpeg");
  const signed = await requestUploadUrl(uploadId, kind, mime, file.size);
  try {
    await putWithProgress(signed.signedUrl, file, mime, onProgress, signal);
  } catch (e) {
    if (e instanceof UploadError && (e.code === "aborted" || e.code === "network")) throw e;
    // Fallback: the official client (no progress events). Loaded only when needed.
    const { supabaseBrowser } = await import("./supabase-browser");
    const { error } = await supabaseBrowser()
      .storage.from("complaint-media")
      .uploadToSignedUrl(signed.path, signed.token, file, { contentType: mime });
    if (error) throw new UploadError("upload_failed");
    onProgress(100);
  }
  return signed.path;
}

/** Compresses a photo to max 1600px / JPEG 0.8. Library is lazy-loaded. */
export async function compressImage(file: File): Promise<File> {
  // GIFs and tiny images are left alone.
  if (file.type === "image/gif" || file.size < 200 * 1024) return file;
  try {
    const { default: imageCompression } = await import("browser-image-compression");
    const out = await imageCompression(file, {
      maxWidthOrHeight: 1600,
      initialQuality: 0.8,
      fileType: "image/jpeg",
      useWebWorker: true,
      maxSizeMB: 10,
    });
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([out], name, { type: "image/jpeg" });
  } catch {
    // HEIC etc. that the browser can't decode — upload the original.
    return file;
  }
}

export function newUploadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback for very old browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
