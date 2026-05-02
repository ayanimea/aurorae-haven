# Backend Integration Requirements

This repository owns frontend compilation targets and deployment packaging.

Backend and database infrastructure are intentionally **not implemented here**.

## Current frontend behavior

- The current frontend is local-first and does **not** ship sign-in UI/routes.
- Authentication environment variables are not consumed by the active UI.
- Optional backend sync can still be integrated through a custom API endpoint.

## Frontend-provided inputs

- API base URL:
  - `VITE_API_BASE_URL`

## Compile mode coverage

- `npm run build:mode:android` -> Android app shell bundle
- `npm run build:mode:desktop` -> offline desktop package
- `npm run build:mode:web` -> online web app shell bundle

If a backend team adds account-authenticated APIs later, that contract should be introduced in a future frontend update together with a user-facing sign-in flow.
