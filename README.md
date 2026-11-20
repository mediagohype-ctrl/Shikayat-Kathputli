# Kathputli Colony – Complaint Form

A mobile-first Hindi complaint form for **Kathputli Colony Transit Camp, Anand Parbat, Delhi**, with its own database and a password-protected admin panel. Built by GO HYPE MEDIA.

- **Public form:** `/`. Intro, then 3 steps (details → problem + voice → photo/video), then a success screen with the complaint number (`KPC-0001`, …)
- **Admin panel:** `/admin`. List, filters, search, detail, status updates, WhatsApp update link, CSV export

## Tech

Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · shadcn-style UI (Radix) · react-hook-form + zod · Supabase Postgres + Storage · jose (admin session cookie) · Vercel.

Files go **straight from the phone to Supabase Storage** through signed upload URLs, so videos up to 50 MB bypass Vercel's ~4.5 MB body limit. The final submit only sends a small JSON payload. The service-role key is used only in server code (`lib/supabase-server.ts` imports `server-only`).

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values (see below)
npm run dev                  # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public; only used as the `apikey` header on direct uploads) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never expose it or prefix it with `NEXT_PUBLIC_` |
| `ADMIN_PASSWORD` | The shared admin password |
| `ADMIN_SESSION_SECRET` | 32+ random characters, used to sign the admin cookie (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_SITE_URL` | Public URL, e.g. `https://shikayat.example.com`. Used for the WhatsApp/Open Graph preview |

## Supabase setup

1. Create a project in region **Mumbai (ap-south-1)**.
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It creates the `complaints` table, the `KPC-0001` sequence, the indexes and RLS (on, with no public policies). It also creates the **private** bucket `complaint-media` (50 MB limit; image/video/audio only).
   If you'd rather create the bucket by hand: Storage → New bucket → name `complaint-media`, Public **off**, file size limit 50 MB, allowed MIME types `image/*, video/*, audio/*`.
3. Copy the URL, anon key and service-role key into your env vars.

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel: New Project → import the repo (framework: Next.js, default settings).
3. Add all six environment variables, then deploy.
4. Optional: add a domain such as `shikayat.<domain>`, set `NEXT_PUBLIC_SITE_URL` to it and redeploy.
5. Test on a real Android phone (Chrome) and an iPhone (Safari): submit a complaint with a photo, a video and a voice note, then check it in `/admin`.

## Where to change things

| What | File |
|---|---|
| Every Hindi string (labels, errors, success text, WhatsApp message) | `lib/strings.hi.ts` |
| Problem categories (key, Hindi label, icon) | `lib/categories.ts` |
| Validation rules and size limits (shared by client and server) | `lib/schema.ts` |
| Rate limits (5/mobile/hour, 20/IP/hour) | `lib/rate-limit.ts` |
| Open Graph image | `public/og.png` (1200×630) |
| Favicon | `app/icon.svg` |

## How it works

```
Phone ─(1) POST /api/upload-url ─▶ Next.js ─ createSignedUploadUrl ─▶ Supabase Storage
Phone ─(2) PUT file (direct, with progress) ────────────────────────▶ Supabase Storage
Phone ─(3) POST /api/complaints (JSON + file paths) ─▶ Next.js ─ insert ─▶ Postgres
Admin ─ /admin (signed httpOnly cookie) ─▶ Next.js ─ read/update + 1-hour signed URLs ─▶ Supabase
```

- **Paths:** `YYYY/MM/<uploadId>/<random>.<ext>`. `uploadId` is a UUID made in the browser when the form opens. The server rejects any path outside that folder.
- **Photos** are compressed in the browser to max 1600 px, JPEG 0.8 (`browser-image-compression`, lazy-loaded). Videos are capped at 50 MB, voice notes at 2 min / 10 MB.
- **Voice:** `MediaRecorder`, using the first supported type from `audio/webm;codecs=opus` → `audio/mp4` (iOS) → `audio/ogg`. If mic access is denied, residents can pick an audio file instead, e.g. a WhatsApp voice note.
- **Draft safety:** Step 1–2 text is saved to `localStorage` and cleared after a successful submit.
- **Abuse protection:** a hidden honeypot field (`website`), rate limits counted in the DB, and a MIME check against the declared kind.
- **Admin auth:** one password, compared in constant time. On success the server sets a 7-day signed httpOnly cookie, and `middleware.ts` checks it on `/admin/*` and `/api/admin/*` (APIs return 401).

### Notes

- Uploads use a plain `XMLHttpRequest` PUT to the signed URL so a progress bar can be shown. If that fails, the code falls back to supabase-js `uploadToSignedUrl` (loaded only when needed).
- Files that a resident uploads and then removes, or whose complaint is never submitted, stay in the bucket. Clean up old folders without a matching row from time to time if storage matters.
- CSV export is UTF-8 with a BOM, so Hindi opens correctly in Excel. Cells starting with `= + - @` are prefixed to block formula injection.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build (type-check + lint)
npm run start      # serve the production build
npm run lint
npm run typecheck
```
