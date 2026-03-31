-- ============================================================
-- University Schedule – Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id   BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL UNIQUE
);

-- 2. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 3. Groups
CREATE TABLE IF NOT EXISTS groups (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 4. Schedule
CREATE TABLE IF NOT EXISTS schedule (
  id               BIGSERIAL PRIMARY KEY,
  group_id         BIGINT REFERENCES groups(id)   ON DELETE CASCADE,
  subject_id       BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id       BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  lecture_teacher  TEXT,
  seminar_teacher  TEXT,
  room             TEXT,
  time             TEXT,
  day_of_week      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Resources
CREATE TABLE IF NOT EXISTS resources (
  id         BIGSERIAL PRIMARY KEY,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  file_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Enable Row Level Security (open read for all)
-- ============================================================
ALTER TABLE teachers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule  ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read teachers"  ON teachers  FOR SELECT USING (true);
CREATE POLICY "Public read subjects"  ON subjects  FOR SELECT USING (true);
CREATE POLICY "Public read groups"    ON groups    FOR SELECT USING (true);
CREATE POLICY "Public read schedule"  ON schedule  FOR SELECT USING (true);
CREATE POLICY "Public read resources" ON resources FOR SELECT USING (true);

-- Service role can do everything (used by API routes with service key)
CREATE POLICY "Service full access teachers"  ON teachers  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full access subjects"  ON subjects  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full access groups"    ON groups    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full access schedule"  ON schedule  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service full access resources" ON resources FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Storage bucket for PDFs and resource files
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read resources bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');

CREATE POLICY "Service upload resources bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resources');
