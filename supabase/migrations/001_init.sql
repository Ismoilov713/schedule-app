-- Run this in Supabase SQL Editor to set up the database

-- Teachers
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null unique,
  created_at timestamptz default now()
);

-- Subjects
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Schedule
create table if not exists schedule (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  lecture_teacher text,
  seminar_teacher text,
  room text,
  time text,
  created_at timestamptz default now()
);

-- Resources (books/files per subject)
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  title text not null,
  file_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (allow public read, restrict writes)
alter table teachers enable row level security;
alter table subjects enable row level security;
alter table groups enable row level security;
alter table schedule enable row level security;
alter table resources enable row level security;

-- Public read policies
create policy "Public read teachers" on teachers for select using (true);
create policy "Public read subjects" on subjects for select using (true);
create policy "Public read groups" on groups for select using (true);
create policy "Public read schedule" on schedule for select using (true);
create policy "Public read resources" on resources for select using (true);

-- Service role bypass (used by API routes with service key)
-- The service role key bypasses RLS automatically in Supabase.

-- Storage bucket for resources
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict do nothing;

create policy "Public read resources bucket"
  on storage.objects for select
  using (bucket_id = 'resources');

create policy "Service role upload resources"
  on storage.objects for insert
  with check (bucket_id = 'resources');
