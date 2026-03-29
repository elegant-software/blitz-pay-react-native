# Implementation Plan: Authentication — Login, Signup & Biometric Access

**Branch**: `001-keycloak-auth-login` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-keycloak-auth-login/spec.md`

## Summary

Add a full authentication layer to BlitzPay: a custom-styled Login screen, a Signup screen, and optional Face ID biometric login. Keycloak v26 is the identity provider. Email/password authentication uses the ROPC grant (direct token exchange — no redirect) for full in-app UX control. Face ID uses Keycloak's native WebAuthn passwordless flow (redirect-based, one-time per device). A thin Express endpoint proxies user registration to keep admin credentials server-side.

## Technical Context

**Language/Version**: TypeScript 5.8 / React 19 / Node.js (Express)
**Primary Dependencies**: `keycloak-js` 26.x (new), existing: Vite 6.2, Tailwind CSS 4.1, Motion 12.x, Lucide React
**Storage**: `sessionStorage` (access/refresh tokens), `localStorage` (biometric enrollment flag)
**Testing**: None configured (existing project has no test suite)
**Target Platform**: Mobile-first PWA — iOS 14+ Safari, Android Chrome; deployed to Google Cloud Run
**Project Type**: Mobile web app (SPA)
**Performance Goals**: Login flow completes in <20 seconds (SC-001); Face ID round-trip in <3 seconds (SC-003)
**Constraints**: No new UI libraries; must match existing Tailwind design system exactly; admin credentials must not appear in browser bundle
**Scale/Scope**: Single-tenant prototype; Keycloak server setup is out of scope

## Constitution Check

*The project constitution is a blank template (not yet filled in). No constitutional gates are active. Proceeding without violations.*

## Project Structure

### Documentation (this feature)

```text
specs/001-keycloak-auth-login/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
├── contracts/
│   └── auth-screens.md  ← Phase 1 complete
└── tasks.md             ← Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
src/
├── lib/
│   ├── keycloak.ts          # NEW — Keycloak singleton + KeycloakContext + useAuth hook
│   ├── LanguageContext.tsx  # unchanged
│   └── translations.ts      # MODIFIED — add auth keys (de + en)
├── screens/
│   ├── Login.tsx            # NEW — Login screen
│   ├── Signup.tsx           # NEW — Signup screen
│   └── (all existing screens unchanged)
├── App.tsx                  # MODIFIED — auth gating + Login/Signup in renderScreen()
├── main.tsx                 # MODIFIED — wrap App with KeycloakProvider
└── types.ts                 # MODIFIED — add 'login' | 'signup' to Screen union

server/
└── register.ts              # NEW (or inline in existing Express entry) — POST /api/register

.env.example                 # MODIFIED — add VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM,
                             #            VITE_KEYCLOAK_CLIENT_ID, KEYCLOAK_ADMIN_SECRET
```

**Structure Decision**: Single project layout (Option 1). All auth code lives in `src/` alongside existing code. The server-side registration proxy is a new route in the existing Express setup (no new project).

## Architecture Decisions (from research.md)

| Decision | Choice | Key Reason |
|----------|--------|-----------|
| Keycloak React package | `keycloak-js` direct + custom context | `@react-keycloak/web` has React 19 / StrictMode incompatibility |
| Email/password flow | ROPC grant (direct token exchange) | Enables fully custom in-app UI without redirect to Keycloak-hosted page |
| Face ID implementation | Keycloak native WebAuthn v26 | Built-in; no custom WebAuthn code against a separate backend |
| Keycloak state in React | Module-level singleton + React Context | Init guard via `useRef` prevents double-init in React 19 Strict Mode |
| Signup flow | Custom form → `/api/register` Express proxy | Admin secret stays server-side; returns user ID for immediate ROPC login |
| Screen gating | `isAuthenticated` flag in App.tsx | Minimal change to existing Screen routing pattern |
| Token persistence | `sessionStorage` | Survives page refresh within tab; cleared on tab close |

## Implementation Phases

### Phase A — Foundation (keycloak.ts + types + env)

1. Add `keycloak-js@26` to dependencies
2. Create `src/lib/keycloak.ts`:
   - Module-level `new Keycloak({ url, realm, clientId })` singleton (reads from `import.meta.env.VITE_KEYCLOAK_*`)
   - `KeycloakContext` and `KeycloakProvider` component (initializes SDK on mount, stores tokens in `sessionStorage`)
   - `useAuth()` hook exposing `{ initialized, authenticated, token, user, login, loginWithBiometric, logout, enrollBiometric, isWebAuthnAvailable }`
   - `login()` performs ROPC grant (`fetch` to `/realms/{realm}/protocol/openid-connect/token`)
   - `loginWithBiometric()` calls `keycloak.login()` with the WebAuthn passwordless flow parameter
   - `enrollBiometric()` calls `keycloak.login({ action: 'webauthn-register-passwordless' })` (AIA)
   - `isWebAuthnAvailable` resolved from `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`
3. Update `src/types.ts`: add `'login' | 'signup'` to `Screen` union
4. Update `.env.example`: add the three `VITE_KEYCLOAK_*` keys + `KEYCLOAK_ADMIN_SECRET`
5. Wrap `<App>` with `<KeycloakProvider>` in `main.tsx` (outside `<React.StrictMode>`)

### Phase B — Auth Gating in App.tsx

6. In `App.tsx`, consume `useAuth()`:
   - Before `isAppReady` resolves: keep showing `SplashScreen` (unchanged)
   - After `isAppReady`: if `!authenticated`, force `currentScreen` to `'login'`
   - Add `'login'` and `'signup'` to the `showHeader`, `showBottomNav`, `showFloatingAvatar` exclusion lists
   - Add cases in `renderScreen()` for `'login'` and `'signup'`

### Phase C — Login Screen

7. Create `src/screens/Login.tsx`:
   - Matches app design system (see `contracts/auth-screens.md` for layout zones)
   - Email input + password input (show/hide toggle via `lucide-react` Eye/EyeOff icon)
   - "Log In" button: calls `login(email, password)` from `useAuth()`, shows spinner while loading, inline error on failure
   - "Forgot password?" link: calls `keycloak.login({ action: 'UPDATE_PASSWORD' })`
   - Face ID button: visible only when `isWebAuthnAvailable && biometricEnrolled`; calls `loginWithBiometric()`
   - "Sign Up" link: calls `onNavigateToSignup()`

### Phase D — Signup Screen

8. Create `src/screens/Signup.tsx`:
   - Full Name, Email, Password, Confirm Password fields
   - Client-side validation: password min 8 chars, 1 uppercase, 1 number; passwords match
   - On submit: POST `{ name, email, password }` to `/api/register`; on 201 → call `login(email, password)` → call `onSignupSuccess()`
   - Inline error handling: 409 shows "Email already in use — [Log in instead]" link
   - "Back" → `onNavigateToLogin()`

### Phase E — Registration Proxy (Express)

9. Add `POST /api/register` to the Express server:
   - Validate request body (name, email, password)
   - Obtain an admin access token via Keycloak's client credentials grant (using `KEYCLOAK_ADMIN_SECRET`)
   - POST to Keycloak Admin REST API: `POST /admin/realms/{realm}/users`
   - Return 201 with `{ userId }`, 409 for conflict, 422 for validation error, 500 for Keycloak errors
   - Admin token is not cached between requests in this prototype (acceptable for prototype scale)

### Phase F — Translations

10. Add auth string keys to `src/lib/translations.ts` (both `de` and `en`):
    - `log_in`, `sign_up`, `email`, `password`, `confirm_password`, `full_name`
    - `forgot_password`, `no_account`, `already_have_account`
    - `face_id_login`, `enable_face_id`
    - `wrong_credentials`, `account_locked`, `session_expired`, `email_conflict`
    - `password_hint` (password strength requirements)

## Complexity Tracking

No constitutional violations to justify. All choices are the simplest option that meets requirements.
