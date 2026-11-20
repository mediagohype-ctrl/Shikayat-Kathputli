-- Kathputli Colony complaint form: initial schema
create extension if not exists pgcrypto;

create type complaint_status as enum ('new', 'in_progress', 'resolved', 'rejected');

create sequence complaint_seq start 1;

create table complaints (
  id            uuid primary key default gen_random_uuid(),
  complaint_no  text unique not null
                default ('KPC-' || lpad(nextval('complaint_seq')::text, 4, '0')),
  name          text not null,
  mobile        text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  house_no      text not null,
  categories    text[] not null check (array_length(categories, 1) >= 1),
  description   text,
  voice_path    text,                         -- e.g. 2026/11/<uploadId>/voice.webm
  media         jsonb not null default '[]',  -- [{path, type:'image'|'video', size}]
  status        complaint_status not null default 'new',
  admin_note    text,
  ip            text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint description_or_voice check (description is not null or voice_path is not null)
);

create index on complaints (created_at desc);
create index on complaints (status);
create index on complaints (mobile);
create index on complaints (ip, created_at);  -- used by the per-IP rate limit

alter table complaints enable row level security;  -- no policies: server uses service role only

-- Private storage bucket for photos, videos and voice notes (50 MB limit).
-- Equivalent to creating it in the dashboard; safe to re-run.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-media', 'complaint-media', false, 52428800, array['image/*', 'video/*', 'audio/*'])
on conflict (id) do nothing;
