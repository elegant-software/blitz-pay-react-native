# UI Contracts: Authentication Screens

**Feature**: 001-keycloak-auth-login
**Date**: 2026-03-29

These contracts define the props, emitted events, and expected behaviour for each new UI surface. They follow the same callback-based prop pattern used throughout the existing BlitzPay screens.

---

## Login Screen (`src/screens/Login.tsx`)

### Props

```typescript
interface LoginProps {
  onLoginSuccess: () => void;      // Navigate to Explore after successful login
  onNavigateToSignup: () => void;  // Switch to Signup screen
}
```

### Visual Layout Contract

| Zone | Content |
|------|---------|
| Top 40% | BlitzPay logo / wordmark (centred), tagline |
| Middle | Email input, Password input (show/hide toggle), "Forgot password?" link |
| Bottom | Primary CTA: "Log In" button (`bg-primary`, full-width, `rounded-2xl`) |
| Below CTA | Secondary: "Don't have an account? **Sign Up**" link |
| Biometric zone | Face ID button (icon + label) — shown only when `isWebAuthnAvailable === true` |

### Behaviour Contract

- All inputs use `rounded-xl bg-surface-container` matching existing form fields in the app.
- Inline error displayed below the relevant field (or below the submit button for server errors).
- "Log In" button shows a spinner (`animate-spin` on an icon) while `isLoading === true`.
- Face ID button is hidden when `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` resolves to `false` or when the user has not yet enrolled (`BiometricEnrollmentFlag.enrolled === false`).
- After a successful Face ID redirect-back, `onLoginSuccess()` is called.
- "Forgot password?" triggers `keycloak.login({ action: 'UPDATE_PASSWORD' })` (Keycloak-hosted flow, returns to app).

---

## Signup Screen (`src/screens/Signup.tsx`)

### Props

```typescript
interface SignupProps {
  onSignupSuccess: () => void;   // Navigate to Explore after successful registration + auto-login
  onNavigateToLogin: () => void; // Back to Login screen
}
```

### Visual Layout Contract

| Zone | Content |
|------|---------|
| Top | Back arrow (left-aligned), "Create Account" heading (Manrope, bold) |
| Middle | Full Name input, Email input, Password input, Confirm Password input |
| Bottom | Primary CTA: "Create Account" button (`bg-primary`, full-width) |
| Below CTA | "Already have an account? **Log In**" link |

### Behaviour Contract

- Password strength requirements shown as inline hints below the password field (min 8 chars, at least 1 uppercase, 1 number).
- "Create Account" is disabled until all fields pass client-side validation.
- On submit: POST to `POST /api/register`, then automatic ROPC login.
- If email is already in use: display "An account with this email already exists. [Log In instead]" — the link calls `onNavigateToLogin()`.
- After successful auto-login, `onSignupSuccess()` is called.

---

## `useAuth` Hook Contract (`src/lib/keycloak.ts`)

```typescript
interface AuthState {
  initialized: boolean;        // Keycloak SDK has completed initialization
  authenticated: boolean;      // User holds a valid session
  token: string | null;        // Current access token (null if not authenticated)
  user: UserProfile | null;    // Decoded user claims
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => void;   // Initiates Keycloak WebAuthn redirect
  logout: () => void;               // Clears session and returns to Login
  enrollBiometric: () => void;      // Initiates Keycloak WebAuthn registration AIA
  isWebAuthnAvailable: boolean;     // Result of platform authenticator check
}

function useAuth(): AuthState;
```

---

## Express Proxy Endpoint Contract (`/api/register`)

Because the Keycloak Admin REST API requires a service-account secret, user registration is proxied through the existing Express server to keep credentials server-side.

### Request

```
POST /api/register
Content-Type: application/json

{
  "name": "string",          // Full name
  "email": "string",         // Email address (unique)
  "password": "string"       // Min 8 chars
}
```

### Response

| Status | Meaning | Body |
|--------|---------|------|
| 201 | User created | `{ "userId": "uuid" }` |
| 409 | Email already in use | `{ "error": "email_conflict" }` |
| 422 | Validation failure | `{ "error": "validation_failed", "fields": [...] }` |
| 500 | Keycloak unavailable | `{ "error": "server_error" }` |

---

## App.tsx Auth Gating Contract

The auth gate in `App.tsx` follows this rendering logic:

```
if (!keycloakInitialized) → show SplashScreen (existing behaviour)
if (!authenticated)       → show Login or Signup screen (no Header, BottomNav, FloatingAvatar)
if (authenticated)        → show existing app screens (existing behaviour)
```

`'login'` and `'signup'` are added to the `Screen` union type. The `showHeader`, `showBottomNav`, and `showFloatingAvatar` exclusion lists gain `'login'` and `'signup'`.
