# Backend Integration Requirements

This repository owns frontend compilation targets and deployment packaging.

Backend and database infrastructure are intentionally **not implemented here**.

## Current frontend behavior (implemented scope)

- The current frontend is local-first and does **not** ship sign-in UI/routes.
- Authentication environment variables are not consumed by the active UI.
- Optional backend sync and account-authenticated flows are future/custom integration work.
- `VITE_API_BASE_URL` is available for future/custom integrations but is unused by the default app shell.

## Frontend-provided inputs

- Optional API base URL (future/custom sync integrations only):
  - `VITE_API_BASE_URL`

## Compile mode coverage

- `npm run build:mode:android` -> Android app shell bundle
- `npm run build:mode:desktop` -> offline desktop package
- `npm run build:mode:web` -> online web app shell bundle

If a backend team adds account-authenticated APIs later, that contract should be introduced in a future frontend update.
That update should include a user-facing sign-in flow.
