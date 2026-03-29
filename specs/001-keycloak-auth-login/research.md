# Research: Keycloak Auth, Face ID, React SPA Integration

**Feature**: 001-keycloak-auth-login
**Date**: 2026-03-29

---

## Decision 1: Keycloak JS Package & Version

**Decision**: Use `keycloak-js` 26.x directly. Do NOT use `@react-keycloak/web`.

**Rationale**:
- `@react-keycloak/web` has documented incompatibility with React 18+ Strict Mode (double-mount causes "Keycloak instance can only be initialized once" error). It is not actively maintained for React 19.
- `keycloak-js` v26.2.3 is the current stable release. As of v26.2.0, it was split from the main Keycloak server project and has its own independent release cadence.
- A minimal custom React Context for Keycloak (see Decision 4) is cleaner, removes a dependency, and is straightforward in this single-SPA codebase.

**Alternatives considered**:
- `@react-keycloak/web`: Rejected due to React 19 / StrictMode incompatibility and maintenance concerns.
- `oidc-client-ts`: More generic OIDC library; adds more complexity than needed since we're committed to Keycloak.

---

## Decision 2: Authentication Flow for Custom In-App UI

**Decision**: Use Keycloak's **Resource Owner Password Credentials (ROPC)** grant for email/password login. This allows fully custom React login and signup screens (matching the app's design system) without any Keycloak-side redirect.

**Rationale**:
- The feature requirement is to match the app's existing design system precisely. Using Authorization Code Flow would redirect users to Keycloak's hosted login page (even with a custom theme, this is a different surface).
- ROPC allows posting credentials directly to Keycloak's token endpoint (`POST /realms/{realm}/protocol/openid-connect/token`) and receiving tokens back as JSON — the full flow happens within the app's own UI.
- This app is a trusted first-party client (same author controls both app and Keycloak). ROPC's primary security concern (credential exposure to third-party clients) does not apply here.
- ROPC is deprecated in OAuth 2.1 for public/third-party apps, but remains valid for trusted, first-party single-page apps in controlled environments.

**Alternatives considered**:
- Authorization Code Flow + PKCE redirect: Rejected because it breaks the in-app UX requirement (forces Keycloak-hosted login page).
- Custom Keycloak theme to style the hosted login page: Rejected as significantly more complex and still produces a separate browsing context.

**Token endpoint call shape**:
```
POST /realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id={clientId}
&username={email}
&password={password}
&scope=openid profile email
```

---

## Decision 3: Face ID via Keycloak Native WebAuthn

**Decision**: Use **Keycloak v26's native WebAuthn support** for Face ID biometric authentication. Do NOT implement manual `navigator.credentials.create/get()` flows against a custom backend.

**Rationale**:
- Keycloak v26+ has built-in WebAuthn support configurable via Authentication Flows in the admin console. No custom plugin or code is needed.
- WebAuthn can be set as a **first factor (passwordless)** authentication method in Keycloak. Users register a platform authenticator (Face ID on iOS, Windows Hello, etc.) and can subsequently log in without a password.
- The registration flow: after first successful ROPC login, trigger Keycloak's **Application-Initiated Action (AIA)** `webauthn-register-passwordless` to enroll the biometric credential. This is a one-time redirect to Keycloak's WebAuthn registration page (acceptable for a one-time setup action).
- Subsequent Face ID logins use Authorization Code Flow (a Keycloak redirect) with a `loginHint` and the WebAuthn passwordless authentication flow. The Keycloak login page for WebAuthn presents only the biometric prompt (no visible form), making the transition seamless.

**iOS compatibility**:
- iOS 14+ / Safari 13+ supports WebAuthn with Face ID.
- Works in both browser tab and home-screen PWA.
- `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` is the standard API to detect biometric capability before showing the Face ID button. Note: returns `false` in non-Safari browsers on iOS (Chrome/Firefox on iOS use WKWebView); biometric buttons should be hidden in those contexts.

**Alternatives considered**:
- Custom WebAuthn + custom backend verifier: Rejected. More code, more attack surface, duplicates what Keycloak already does natively.
- `@simplewebauthn/browser` library: Rejected. Only needed for custom backend implementations; not applicable here.

---

## Decision 4: Keycloak State in React

**Decision**: Use a **module-level singleton** Keycloak instance combined with a **lightweight custom React Context** (`KeycloakContext`) to share `{ initialized, authenticated, token, login, logout }` across the app.

**Rationale**:
- Module-level singleton avoids re-creating the Keycloak object on renders. Initialization is called once in a `useEffect` with an empty dependency array inside the `KeycloakProvider`.
- React Context propagates the ready state to all consumers without prop drilling.
- This is ~60 lines of code, avoids all third-party auth-wrapper packages, and is compatible with React 19 / StrictMode (initialization guard via a `useRef` flag).

**StrictMode handling**: Wrap initialization in a `useRef` initialized flag to prevent double-init in React 19 StrictMode.

---

## Decision 5: Screen Architecture for Auth Gating

**Decision**: Add `'login'` and `'signup'` to the `Screen` type union. Gate rendering at the top level in `App.tsx` with a separate `isAuthenticated` check — when `!isAuthenticated`, only render the Login or Signup screen (no header, bottom nav, or floating avatar).

**Rationale**:
- Minimal change to the existing Screen-based routing pattern.
- The `SplashScreen` already acts as a loading gate; auth check sits after it.
- Login and Signup screens use the same Motion `AnimatePresence` transition pattern as all other screens.
- After successful login, `currentScreen` is set to `'explore'`, matching the existing flow.

**Screen gating logic**:
```
SplashScreen → (keycloak initialized) →
  if !authenticated → Login screen (or Signup)
  if authenticated  → existing app screens (Explore, etc.)
```

---

## Decision 6: Signup Flow

**Decision**: Custom React Signup screen → POST to Keycloak's **Admin REST API** (`POST /admin/realms/{realm}/users`) to create the user, then immediately perform an ROPC login.

**Rationale**:
- Keycloak's self-registration via the hosted form is not available via ROPC. The Admin REST API endpoint for creating users is straightforward.
- The Admin REST API requires a service account or admin credentials. For this SPA prototype, a dedicated `service-account` client with `manage-users` permission is used (credentials stored server-side or as env vars, not in the browser bundle).
- Alternatively, a minimal Express backend endpoint (`POST /api/register`) can proxy the admin call, keeping admin credentials out of the browser.

**Alternatives considered**:
- Redirect to Keycloak's hosted registration form: Rejected (breaks the in-app UX goal).
- Keycloak's OpenID Connect Dynamic Client Registration: Not applicable (that's for registering clients, not users).

---

## Unresolved / Deferred

- **Keycloak server instance**: The plan assumes a Keycloak server is available (self-hosted or cloud-managed). Its URL, realm, and client ID will be environment variables. Setup of the Keycloak server itself is out of scope for this feature's implementation tasks.
- **Email verification**: Keycloak can be configured to send a verification email after registration. Whether this is enabled is a Keycloak admin configuration, not app code.
- **Token storage strategy**: In-memory tokens (default) are lost on page refresh; `sessionStorage` tokens persist for the tab session. For this prototype, `sessionStorage` is used to survive page refreshes without a full re-login. This can be revisited when moving to production.
