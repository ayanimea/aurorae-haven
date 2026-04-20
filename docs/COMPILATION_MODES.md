# Compilation and Deployment Modes

Aurorae Haven now ships with three explicit build/deployment targets:

1. **Android app mode** (signed-in, packaged from `dist-android-web`)
2. **Offline desktop mode** (current local-first package)
3. **Online web mode** (signed-in + PostgreSQL via Docker)

## 1) Android app mode (signed-in, local-first)

### What this mode does

- Builds a web bundle with relative paths for native wrapping.
- Produces `dist-android-web/` with `npm run build:mode:android`.
- Supports OAuth provider configuration for **Google, Facebook, and GitHub**.

### Build steps

```bash
cp .env.android.example .env.android.local
npm ci
npm run build:mode:android
```

### Package APK/AAB (Trusted Web Activity)

```bash
npm i -g @bubblewrap/cli
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
cp .env.offline.example .env.offline.local
npm ci
npm run build:mode:desktop
```

### Run offline package

1. Extract the package generated in `dist-offline/`
2. Launch one of the included scripts (`start-aurorae-haven.*`)
3. Open `http://localhost:8000`

See: `docs/OFFLINE-DOWNLOAD.md`.

## 3) Online web mode (signed-in + PostgreSQL)

### What this mode does

- Builds a production web bundle for hosted deployment.
- Enables configuration for sign-in with **Google, Facebook, and GitHub**.
- Provides Docker orchestration for web hosting and PostgreSQL with PgBouncer pooling.

### Build and run steps

```bash
cp .env.web.example .env.web.local
npm ci
npm run build:mode:web
docker compose -f docker-compose.web.yml up --build
```

### Database setup

- Extensions: `database/postgresql/init/001_extensions.sql`
- Main migration: `database/postgresql/migrations/001_account_schema.sql`
- Design reference: `docs/POSTGRESQL_ACCOUNT_SCHEMA.md`

The compose stack includes:

- `postgres` (database)
- `pgbouncer` (connection pooling)
- `db-migrate` (migration bootstrap)
- `web` (Nginx static hosting build)

## Session management and credentials

For online/Android signed-in modes:

- Use hashed session tokens and server-side expiration.
- Keep OAuth client IDs and session secrets in environment variables only.
- Never commit real credentials.

Required variables are documented in `.env.web.example` and `.env.android.example`.

## Cross-mode data compatibility summary

- **Offline desktop**: browser local storage stack (IndexedDB/OPFS/localStorage)
- **Online web**: PostgreSQL account-scoped schema + session tables
- **Android**: can run local-first or connect to the same PostgreSQL-backed web API

Use import/export JSON backups when moving between local and account-backed modes.

## Validation checklist

- [ ] Android bundle builds: `npm run build:mode:android`
- [ ] Offline package builds: `npm run build:mode:desktop`
- [ ] Web bundle builds: `npm run build:mode:web`
- [ ] PostgreSQL migration applies in Docker compose stack
- [ ] OAuth env variables present for Google/Facebook/GitHub
