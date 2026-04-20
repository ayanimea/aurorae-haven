CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_oauth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  -- Keep providers aligned with scripts/compilationModes.js authProviders.
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'github')),
  provider_account_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  quadrant TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  day DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  type TEXT NOT NULL DEFAULT 'task',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_duration_secs INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT 'daily',
  streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_completed DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_settings (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_account_id
  ON account_oauth_identities (account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id
  ON sessions (account_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_account_id
  ON tasks (account_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_account_day
  ON schedule_events (account_id, day);
CREATE INDEX IF NOT EXISTS idx_routines_account_id
  ON routines (account_id);
CREATE INDEX IF NOT EXISTS idx_habits_account_id
  ON habits (account_id);
CREATE INDEX IF NOT EXISTS idx_notes_account_id
  ON notes (account_id);

CREATE OR REPLACE FUNCTION app_current_account_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  account_id_setting TEXT;
BEGIN
  account_id_setting := current_setting('app.current_account_id', true);

  IF account_id_setting IS NULL OR account_id_setting = '' THEN
    RAISE EXCEPTION 'Session context error: app.current_account_id is not set. Call SET LOCAL app.current_account_id = <account-uuid> before querying account data.';
  END IF;

  RETURN account_id_setting::uuid;
END;
$$;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'tasks_owner') THEN
    CREATE POLICY tasks_owner ON tasks
      USING (account_id = app_current_account_id())
      WITH CHECK (account_id = app_current_account_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schedule_events' AND policyname = 'schedule_events_owner') THEN
    CREATE POLICY schedule_events_owner ON schedule_events
      USING (account_id = app_current_account_id())
      WITH CHECK (account_id = app_current_account_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'routines' AND policyname = 'routines_owner') THEN
    CREATE POLICY routines_owner ON routines
      USING (account_id = app_current_account_id())
      WITH CHECK (account_id = app_current_account_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habits' AND policyname = 'habits_owner') THEN
    CREATE POLICY habits_owner ON habits
      USING (account_id = app_current_account_id())
      WITH CHECK (account_id = app_current_account_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notes' AND policyname = 'notes_owner') THEN
    CREATE POLICY notes_owner ON notes
      USING (account_id = app_current_account_id())
      WITH CHECK (account_id = app_current_account_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'account_settings' AND policyname = 'account_settings_owner') THEN
    CREATE POLICY account_settings_owner ON account_settings
      USING (account_id = app_current_account_id())
      WITH CHECK (account_id = app_current_account_id());
  END IF;
END $$;
