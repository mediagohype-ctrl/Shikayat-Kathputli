// Shared zod schemas (client + server). Uses `zod/mini` to keep the resident's page small;
// the rules and Hindi messages are identical on both sides.
import * as z from "zod/mini";
import { CATEGORY_KEYS } from "./categories";
import { hi } from "./strings.hi";

export const MB = 1024 * 1024;
export const LIMITS = {
  image: 10 * MB,
  video: 50 * MB,
  audio: 10 * MB,
  maxMedia: 3,
  maxVoiceSeconds: 120,
  descriptionMax: 1000,
} as const;

export const MOBILE_RE = /^[6-9]\d{9}$/;

const nameField = z.string().check(z.trim(), z.minLength(2, hi.errors.name), z.maxLength(60, hi.errors.name));
const mobileField = z.string().check(z.trim(), z.regex(MOBILE_RE, hi.errors.mobile));
const houseNoField = z.string().check(z.trim(), z.minLength(1, hi.errors.houseNo), z.maxLength(30, hi.errors.houseNo));
const descriptionField = z.string().check(z.maxLength(LIMITS.descriptionMax, hi.errors.descriptionLong));

/* ---------- Steps 1–2 (wizard; fields are triggered per step) ---------- */

export const categoriesSchema = z.array(z.enum(CATEGORY_KEYS)).check(z.minLength(1, hi.errors.categories));

export const wizardSchema = z
  .object({
    name: nameField,
    mobile: mobileField,
    houseNo: houseNoField,
    categories: categoriesSchema,
    description: descriptionField,
    hasVoice: z.boolean(),
    website: z.string(),
  })
  .check(
    z.superRefine((v, ctx) => {
      if (!v.description.trim() && !v.hasVoice) {
        ctx.addIssue({ code: "custom", path: ["description"], message: hi.errors.descriptionOrVoice, input: v });
      }
    }),
  );

/* ---------- Step 3 ---------- */

export const mediaItemSchema = z.object({
  path: z.string().check(z.minLength(1), z.maxLength(300)),
  type: z.enum(["image", "video"]),
  size: z.number().check(z.int(), z.positive(), z.maximum(LIMITS.video)),
});
export type MediaItem = z.infer<typeof mediaItemSchema>;

const mediaList = z
  .array(mediaItemSchema)
  .check(z.minLength(1, hi.errors.media), z.maxLength(LIMITS.maxMedia, hi.errors.mediaMax));

export const step3Schema = z.object({ media: mediaList });

/* ---------- Full payload (server re-validates with the same rules) ---------- */

export const complaintPayloadSchema = z
  .object({
    uploadId: z.uuid(),
    name: nameField,
    mobile: mobileField,
    houseNo: houseNoField,
    categories: categoriesSchema,
    description: z._default(z.optional(descriptionField), ""),
    voicePath: z.optional(z.nullable(z.string().check(z.minLength(1), z.maxLength(300)))),
    media: mediaList,
    website: z._default(z.optional(z.string()), ""), // honeypot: must stay empty
  })
  .check(
    z.superRefine((v, ctx) => {
      if (!v.description.trim() && !v.voicePath) {
        ctx.addIssue({ code: "custom", path: ["description"], message: hi.errors.descriptionOrVoice, input: v });
      }
    }),
  );
export type ComplaintPayload = z.input<typeof complaintPayloadSchema>;

/* ---------- Upload URL request ---------- */

export const uploadKindSchema = z.enum(["image", "video", "audio"]);
export type UploadKind = z.infer<typeof uploadKindSchema>;

export const uploadUrlSchema = z.object({
  uploadId: z.uuid(),
  kind: uploadKindSchema,
  mime: z.string().check(z.minLength(3), z.maxLength(100)),
  size: z.number().check(z.int(), z.positive()),
});

export function mimeMatchesKind(mime: string, kind: UploadKind): boolean {
  const base = mime.split(";")[0].trim().toLowerCase();
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(base) && base.startsWith(`${kind}/`);
}

export function extFromMime(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/3gpp": "3gp",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/opus": "opus",
    "audio/aac": "aac",
    "audio/wav": "wav",
    "audio/x-m4a": "m4a",
    "audio/amr": "amr",
  };
  return map[base] ?? (base.split("/")[1]?.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin");
}

/* ---------- Admin ---------- */

export const STATUSES = ["new", "in_progress", "resolved", "rejected"] as const;
export type ComplaintStatus = (typeof STATUSES)[number];

const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export const adminListQuerySchema = z.object({
  status: z.optional(z.enum(STATUSES)),
  category: z.optional(z.enum(CATEGORY_KEYS)),
  q: z.optional(z.string().check(z.trim(), z.maxLength(100))),
  from: z.optional(isoDate),
  to: z.optional(isoDate),
  page: z._default(z.coerce.number().check(z.int(), z.minimum(1), z.maximum(10000)), 1),
});
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

export const adminPatchSchema = z
  .object({
    status: z.optional(z.enum(STATUSES)),
    admin_note: z.optional(z.nullable(z.string().check(z.maxLength(2000)))),
  })
  .check(z.refine((v) => v.status !== undefined || v.admin_note !== undefined, "nothing to update"));

export type ComplaintRow = {
  id: string;
  complaint_no: string;
  name: string;
  mobile: string;
  house_no: string;
  categories: string[];
  description: string | null;
  voice_path: string | null;
  media: MediaItem[];
  status: ComplaintStatus;
  admin_note: string | null;
  ip: string | null;
  created_at: string;
  updated_at: string;
};

export function parseListQuery(sp: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const k of ["status", "category", "q", "from", "to", "page"]) {
    const v = sp.get(k);
    if (v) raw[k] = v;
  }
  return adminListQuerySchema.safeParse(raw);
}
