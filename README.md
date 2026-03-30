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
