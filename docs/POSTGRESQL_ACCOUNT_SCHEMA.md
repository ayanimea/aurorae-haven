# PostgreSQL account-scoped schema (design draft)

This document defines a PostgreSQL schema blueprint for making Aurorae Haven data account-specific while preserving current app data domains from:

- `src/utils/indexedDBManager.js`
- `src/utils/settingsManager.js`

It is a **design reference** for a future server-side migration.

## 1) Prerequisites

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;
```

## 2) Identity, auth, and security core

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  provider TEXT,                  -- local | google | github | ...
  provider_id TEXT,
  password_hash TEXT,             -- null for oauth-only accounts
  email_verified_at TIMESTAMPTZ,
  mfa_secret_encrypted TEXT,      -- encrypted at app layer
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256(refresh token)
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  table_name TEXT,
  row_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 3) Account-scoped application data

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  quadrant TEXT,
  is_important BOOLEAN NOT NULL DEFAULT false,
  priority SMALLINT,
  tags TEXT[],
  due_date DATE,
  linked_habit_id UUID,
  linked_routine_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'task',
  day DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN NOT NULL DEFAULT false,
  duration_minutes SMALLINT,
  preparation_time SMALLINT NOT NULL DEFAULT 0,
  travel_time SMALLINT NOT NULL DEFAULT 0,
  linked_task_id UUID,
  linked_routine_id UUID,
  linked_habit_id UUID,
  external_calendar_id UUID,
  description TEXT,
  color TEXT,
  recurrence_rule TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_duration_secs INT,
  last_used TIMESTAMPTZ,
  xp_total INT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE routine_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_secs INT,
  xp INT NOT NULL DEFAULT 0,
  accent_color TEXT,
  metadata JSONB,
  UNIQUE (routine_id, position)
);

CREATE TABLE routine_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  skipped_steps INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  summary JSONB
);

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  schedule TEXT NOT NULL DEFAULT 'daily',
  custom_days SMALLINT[],
  start_date DATE,
  motivation TEXT,
  streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  paused BOOLEAN NOT NULL DEFAULT false,
  last_completed DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  xp_earned INT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_date)
);

CREATE TABLE habit_vacation_dates (
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  vacation_date DATE NOT NULL,
  PRIMARY KEY (habit_id, vacation_date)
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT,
  category TEXT,
  locked BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legacy one-record brain dump support (migration compatibility)
CREATE TABLE brain_dump (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  tags TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date DATE,
  value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  color TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE file_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE account_settings (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 4) Essential indexes

```sql
CREATE INDEX idx_sessions_active
  ON sessions (account_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_audit_log_account_created_at ON audit_log (account_id, created_at);

CREATE INDEX idx_tasks_account_id ON tasks (account_id);
CREATE INDEX idx_schedule_events_account_day ON schedule_events (account_id, day);
CREATE INDEX idx_routines_account_id ON routines (account_id);
CREATE INDEX idx_routine_steps_routine_id ON routine_steps (routine_id);
CREATE INDEX idx_habits_account_id ON habits (account_id);
CREATE INDEX idx_habit_completions_habit_day ON habit_completions (habit_id, completed_date);
CREATE INDEX idx_notes_account_id ON notes (account_id);
CREATE INDEX idx_stats_account_type_date ON stats (account_id, type, date);
CREATE INDEX idx_templates_account_type ON templates (account_id, type);
CREATE INDEX idx_calendar_subscriptions_account_enabled
  ON calendar_subscriptions (account_id, enabled);
CREATE INDEX idx_file_refs_account_entity
  ON file_refs (account_id, entity_type, entity_id);
CREATE INDEX idx_backups_account_created_at ON backups (account_id, created_at);
```

## 5) Row-level security (RLS)

The API sets the account context per transaction:

```sql
SET LOCAL app.current_account_id = '<account-uuid>';
```

Enable RLS and apply per-table owner policies:

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_vacation_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_dump ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_owner ON tasks
  USING (account_id = current_setting('app.current_account_id')::uuid)
  WITH CHECK (account_id = current_setting('app.current_account_id')::uuid);

-- Repeat the same policy shape on all account-scoped tables above.
```

## 6) Security controls checklist

- Passwords hashed with **Argon2id** (preferred) and never stored in plain text.
- Refresh/session tokens are random opaque values; only token hash is persisted.
- Cookies for refresh tokens are `HttpOnly`, `Secure`, `SameSite=Lax`.
- All SQL writes are parameterized (or ORM-generated) to prevent injection.
- MFA secret is encrypted at application layer before DB write.
- Auth endpoints are rate-limited and account lockout is enforced.
- Object storage access uses signed short-lived URLs (no public raw keys).
- `ON DELETE CASCADE` plus audit events supports account deletion/GDPR flows.
- Backups are encrypted at rest and tested for restoration.

## 7) Mapping to current local stores

Current app stores in IndexedDB/local settings map to PostgreSQL entities as follows:

- `tasks` → `tasks`
- `routines` → `routines`, `routine_steps`, `routine_runs`
- `habits` → `habits`, `habit_completions`, `habit_vacation_dates`
- `dumps` + note history features → `notes`, `note_versions`, optional `brain_dump`
- `schedule` → `schedule_events`
- `stats` → `stats`
- `file_refs` → `file_refs`
- `backups` → `backups`
- `templates` → `templates`
- `calendar_subscriptions` → `calendar_subscriptions`
- `aurorae_settings` (`settingsManager`) → `account_settings`
