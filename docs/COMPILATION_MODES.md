# Compilation and Deployment Modes

Aurorae Haven ships with three explicit build/deployment targets:

1. **Android app mode** (packaged from `dist-android-web`)
2. **Offline desktop mode** (current local-first package)
3. **Online web mode** (hosted app shell + optional backend API integration)

## 1) Android app mode (local-first)

### What this mode does

- Builds a web bundle with base path `/aurorae-haven/` for native wrapping (matching `android/twa-manifest.json` `startUrl`).
- Produces `dist-android-web/` with `npm run build:mode:android`.

### Build steps

```bash
cp .env.android.example .env.local
npm ci
npm run build:mode:android
```

`npm run build:mode:android` runs Vite in its default mode, so use `.env.local` (or `.env.production.local`) for values that must be loaded by Vite.
Mode defaults are deterministic; to intentionally override the build base path, set `AURORAE_VITE_BASE_URL_OVERRIDE`.

### Package APK/AAB (Trusted Web Activity)

```bash
npx @bubblewrap/cli@1.24.1 --version
npm run package:android
```

- Android packaging configuration lives in `android/twa-manifest.json`.
- `package:android` uses Bubblewrap to produce Android project artifacts for APK/AAB generation.

## 2) Offline desktop mode (current setup)

### What this mode does

- Preserves the local-only, offline desktop experience.
- Uses the existing offline package workflow and embedded local server launchers.
- Keeps this mode isolated from auth/database requirements.

### Build steps

```bash
cp .env.offline.example .env.local
npm ci
npm run build:mode:desktop
```

`npm run build:mode:desktop` also runs Vite in default mode, so keep mode-specific values in `.env.local` (or `.env.production.local`).

### Run offline package

1. Extract the package generated in `dist-offline/`
2. Launch one of the included scripts (`start-aurorae-haven.*`)
3. Open `http://localhost:8000`

See: `docs/OFFLINE-DOWNLOAD.md`.

## 3) Online web mode (hosted app shell)

### What this mode does

- Builds a production web bundle for hosted deployment.
- Provides Docker orchestration for static web hosting.
- Supports optional backend/API integration without managing backend/database infrastructure in this repository.

### Build and run steps

```bash
cp .env.web.example .env.local
npm ci
npm run build:mode:web
docker compose -f docker-compose.web.yml up --build
```

`npm run build:mode:web` runs Vite in default mode as well, so place build-time variables in `.env.local` (or `.env.production.local`).

Docker Compose serves the web bundle at the root path (`/`) on `http://localhost:8080`.
The compose build overrides the mode default with `AURORAE_VITE_BASE_URL_OVERRIDE=/` for local nginx hosting.

### Optional backend integration (provided to backend team)

- Optional API base URL can be set via `VITE_API_BASE_URL` for future/custom backend integrations.
- The current app shell does not consume `VITE_API_BASE_URL` by default.
- Data API contracts and storage design can be owned by the backend team.

Future backend draft reference (optional, not required for hosting the frontend bundle): `docs/POSTGRESQL_ACCOUNT_SCHEMA.md`.

## Cross-mode data compatibility summary

- **Offline desktop**: browser local storage stack (IndexedDB/OPFS/localStorage)
- **Online web**: hosted frontend bundle with optional API integration
- **Android**: local-first app shell; optional API integration can be added by backend consumers

Use import/export JSON backups when moving between local-first installs and devices.

## Validation checklist

- [ ] Android bundle builds: `npm run build:mode:android`
- [ ] Offline package builds: `npm run build:mode:desktop`
- [ ] Web bundle builds: `npm run build:mode:web`
- [ ] Backend/API integration requirements shared with backend team (if needed)
