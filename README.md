<div align="center">
  <img width="1200" height="475" alt="Explore screen" src="assets/explore.svg" />
</div>

# BlitzPay (Web + React Native)

This repo houses both the AI Studio / Vite-powered web experience and the React Native (Expo) counterpart. The same Keycloak-backed auth layer is shared, with the web bundle consuming `VITE_` env vars and the mobile app using `EXPO_PUBLIC_` equivalents.

View the web experience in AI Studio: https://ai.studio/apps/97422928-d654-4fcd-82de-45e056b0428d

## Web (Vite + AI Studio)

**Prerequisites:** Node.js

1. Install dependencies in the repo root:
   `npm install`
2. Copy `.env.example` to `.env` and populate the Gemini, Keycloak, and app URL values described below.
3. Start the Vite dev server:
   `npm run dev`

## React Native (Expo)

**Prerequisites:** Node.js, npm, Android/iOS device or simulator

1. Install the mobile dependencies:
   `cd mobile && npm install`
2. Copy `mobile/.env.example` to `mobile/.env` and match the Keycloak/API settings that the web app uses.
3. Spin up Expo (Metro bundler):
   `npm run start`
4. Launch on a simulator or device:
   - `npm run android`
   - `npm run ios`

### EAS build prerequisites

Before running the GitHub Actions EAS jobs (`eas-build`, `eas-update`), make sure `mobile/eas.json` exists.

Generate it with:
`cd mobile && npx eas build:configure`

This creates the EAS project config file used by CI.

CI note for iOS: the `preview` profile is configured with `ios.simulator: true` in `mobile/eas.json`, so non-interactive GitHub Actions builds do not require signing credentials.

If you need an installable iOS device build (internal distribution or production), run EAS credentials setup once in interactive mode (for example `cd mobile && npx eas credentials`) and then use a non-simulator profile.

### Async EAS builds (recommended)

To avoid blocking on one platform while the other is still running, use the async build script:

- `cd mobile && npm run build:eas:async`
- `cd mobile && npm run build:eas:async:clear-cache`

Optional arguments:

- `--profile <profile>` (default: `production`)
- `--platforms ios,android` (or `ios` / `android`)
- `--poll-ms <milliseconds>` (default: `30000`)

The script starts EAS builds with `--no-wait`, captures build IDs, then polls each build until completion. The process exits non-zero if any platform fails.

### Avoid duplicate EAS builds in CI

The GitHub Actions workflow (`.github/workflows/mobile-react-native-build.yml`) includes a duplicate-build guard before triggering EAS:

- It checks active builds with `eas build:list` for the same app version, profile, and platform.
- If an `in-progress` or `in-queue` build already exists, CI sets `skip_build=true` and does not trigger a new build.
- For `eas-platform: all`, it checks Android and iOS independently to prevent duplicate jobs per platform.

Release notes in CI: the workflow input `release-notes-tag` defaults to `latest`. During `eas-update`, CI reads that GitHub release and uses it as the EAS update message. Set a specific tag (for example `v1.2.0`) to target a particular release.

CI app versioning: during `eas-build`, the same `release-notes-tag` input (default `latest`) is resolved to a GitHub release tag and mapped to Expo app version (`v1.2.3` -> `1.2.3`). CI writes that value into `mobile/app.json` before EAS build so EAS does not stay on the static `1.0.0`.

### Sync `mobile/.env` to GitHub Actions vars/secrets

Use `.github/scripts/sync-mobile-env-to-github.sh` to push mobile env keys to your repository settings:

- `EXPO_PUBLIC_*` keys are stored as GitHub Variables.
- All other keys are stored as GitHub Secrets.

Prerequisites:

- `gh` CLI installed and authenticated (`gh auth login`).
- `mobile/.env` present locally.

Run from repo root:

- `./.github/scripts/sync-mobile-env-to-github.sh`

Optional flags:

- `--env-file <path>` to use a different env file.
- `--repo <owner/name>` to target a different repo.
- `--environment <name>` to write environment-scoped vars/secrets (for example `staging` or `production`).

Example:

- `./.github/scripts/sync-mobile-env-to-github.sh --environment staging`

## Environment variables

### Web (Vite)

The root `.env.example` lists every required key. At a minimum, set the following before running `npm run dev`:

- `APP_URL`: Public URL used for self-referential links, OAuth callbacks, and the API proxy.
- `VITE_AUTH_BYPASS`: Set to `true` for dev-only bypass mode that auto-logs a fake user without Keycloak.
- `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`: Keycloak server, realm, and client for the SPA.
- `KEYCLOAK_SERVER_CLIENT_ID`, `KEYCLOAK_ADMIN_SECRET`: Server-side credentials consumed by `server.ts`; they must never be prefixed with `VITE_` because they must stay private.

### React Native (Expo)

Use `mobile/.env.example` as the template. Populate these keys for the mobile experience:

- `EXPO_PUBLIC_KEYCLOAK_URL`, `EXPO_PUBLIC_KEYCLOAK_REALM`, `EXPO_PUBLIC_KEYCLOAK_CLIENT_ID`: Match the same Keycloak deployment used by the web app.
- `EXPO_PUBLIC_AUTH_BYPASS`: Mirrors `VITE_AUTH_BYPASS` so you can skip Keycloak during development.
- `EXPO_PUBLIC_API_URL`: Base URL for the backend API the mobile app calls (defaults to `http://localhost:3001`).
