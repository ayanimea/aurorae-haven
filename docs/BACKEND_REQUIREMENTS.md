# Backend Requirements for Signed-In Modes

This repository owns frontend compilation targets and deployment packaging.

Backend and database infrastructure are intentionally **not implemented here**.

## Required backend capabilities

1. Sign-in providers:
   - Email account (sign-up + sign-in)
   - Google
   - Facebook
   - GitHub
2. Session management:
   - login/logout/session refresh endpoints
   - secure cookie or token policy
3. Data API endpoints for account-scoped app data (tasks, routines, habits, notes, schedule, settings)
4. PostgreSQL ownership:
   - schema migrations
   - connection pooling
   - backup/restore policy

## Frontend-provided inputs

- Sign-in configuration via:
  - `VITE_AUTH_EMAIL_ENABLED`
  - `VITE_OAUTH_GOOGLE_CLIENT_ID`
  - `VITE_OAUTH_FACEBOOK_APP_ID`
  - `VITE_OAUTH_GITHUB_CLIENT_ID`
- API base URL via:
  - `VITE_API_BASE_URL`

## Backend-owned secrets

- Session secret (backend-owned, never in frontend bundle):
  - `SESSION_SECRET`

## Compile mode coverage

- `npm run build:mode:android` -> Android app shell bundle
- `npm run build:mode:desktop` -> offline desktop package
- `npm run build:mode:web` -> online web app shell bundle

The backend team can integrate these bundles with their own API and PostgreSQL stack.

## Data migration on sign-in / sign-up

When a user signs in or creates an account while local data already exists in their
browser (tasks, routines, habits, notes, schedule events), the frontend will collect
that data via `src/utils/authDataMigration.js` and POST it to the backend for merge.

**Required endpoint:**

```
POST /api/auth/migrate-local-data
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "tasks":    [ ... ],
  "routines": [ ... ],
  "habits":   [ ... ],
  "dumps":    [ ... ],
  "schedule": [ ... ],
  "migratedAt": "<ISO 8601 timestamp>"
}
```

**Merge strategy (backend responsibility):**

- Deduplicate by `id` field: if a record with the same `id` already exists in the
  account, keep the record with the later `updatedAt` / `createdAt` timestamp.
- For records without a matching `id`, insert as new records owned by the account.
- Respond with `{ "merged": <count>, "skipped": <count> }` so the frontend can
  confirm the migration succeeded before clearing local storage.
