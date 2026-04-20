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
