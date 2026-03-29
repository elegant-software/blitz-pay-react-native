# Data Model: Authentication Feature

**Feature**: 001-keycloak-auth-login
**Date**: 2026-03-29

---

## Entities

### AuthSession (in-memory / sessionStorage)

Represents the active authenticated session held by the app.

| Field | Type | Notes |
|-------|------|-------|
| `accessToken` | `string` | JWT; used for API calls |
| `refreshToken` | `string` | Longer-lived; used to renew access token |
| `idToken` | `string` | OIDC ID token; contains user claims |
| `expiresAt` | `number` | Unix epoch ms when access token expires |

Stored in `sessionStorage` under a single key (`blitzpay_session`). Cleared on logout.

---

### UserProfile (derived from ID token claims)

The decoded subset of user information displayed in the app (e.g., Account screen, FloatingAvatar).

| Field | Type | Source Claim |
|-------|------|-------------|
| `id` | `string` | `sub` |
| `email` | `string` | `email` |
| `name` | `string` | `name` (preferred_username fallback) |
| `emailVerified` | `boolean` | `email_verified` |

Derived at runtime by decoding the ID token; not separately persisted.

---

### BiometricEnrollmentFlag (localStorage, device-scoped)

A lightweight flag indicating whether the current user on this device has enrolled a Face ID credential in Keycloak.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `string` | Keycloak subject ID |
| `enrolled` | `boolean` | `true` once AIA registration completes |
| `enrolledAt` | `string` | ISO 8601 date |

Stored in `localStorage` under `blitzpay_biometric_{userId}`. Used to decide whether to show the Face ID button on the login screen.

---

### LoginFormState (ephemeral, component-local)

Transient UI state for the Login screen.

| Field | Type |
|-------|------|
| `email` | `string` |
| `password` | `string` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

---

### SignupFormState (ephemeral, component-local)

Transient UI state for the Signup screen.

| Field | Type |
|-------|------|
| `name` | `string` |
| `email` | `string` |
| `password` | `string` |
| `confirmPassword` | `string` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

---

## State Transitions

```
App boot
  │
  ├─ keycloak initializing ──→ SplashScreen shown
  │
  └─ keycloak initialized
       │
       ├─ sessionStorage has valid token ──→ restore session ──→ Explore screen
       │
       └─ no valid token ──→ Login screen
              │
              ├─ email/password submit ──→ ROPC token request
              │      ├─ success ──→ store AuthSession ──→ Explore screen
              │      │              └─ [if biometric supported + not enrolled]
              │      │                    └─ show Face ID enrollment prompt
              │      └─ failure ──→ show inline error, stay on Login
              │
              ├─ Face ID button tap ──→ Keycloak WebAuthn redirect
              │      ├─ success ──→ store AuthSession ──→ Explore screen
              │      └─ failure/cancel ──→ return to Login (password fallback)
              │
              └─ "Sign Up" tap ──→ Signup screen
                     │
                     ├─ submit ──→ POST /api/register ──→ ROPC login
                     │      ├─ success ──→ store AuthSession ──→ Explore screen
                     │      └─ failure ──→ show inline error, stay on Signup
                     └─ "Back" ──→ Login screen

Authenticated session
  │
  └─ access token expires ──→ refresh via refreshToken
         ├─ refresh success ──→ update AuthSession
         └─ refresh failure ──→ clear AuthSession ──→ Login screen ("Session expired")
```

---

## New Source Files

| File | Purpose |
|------|---------|
| `src/lib/keycloak.ts` | Keycloak singleton instance + `KeycloakContext` + `KeycloakProvider` + `useAuth` hook |
| `src/screens/Login.tsx` | Login screen component |
| `src/screens/Signup.tsx` | Signup screen component |
| `src/types.ts` | Add `'login' \| 'signup'` to `Screen` union |
| `src/lib/translations.ts` | Add auth-related translation keys (de + en) |

---

## Environment Variables (additions)

| Variable | Purpose |
|----------|---------|
| `VITE_KEYCLOAK_URL` | Base URL of the Keycloak server |
| `VITE_KEYCLOAK_REALM` | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak public client ID |
| `KEYCLOAK_ADMIN_SECRET` | Service account secret for user registration (server-side only, NOT prefixed with VITE_) |
