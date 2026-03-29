# Tasks: Authentication — Login, Signup & Biometric Access

**Input**: Design documents from `/specs/001-keycloak-auth-login/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- No test tasks (no test suite configured in this project)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure environment, extend types.

- [x] T001 Install `keycloak-js@26` — run `npm install keycloak-js@26` and confirm package.json
- [x] T002 [P] Add `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`, `KEYCLOAK_ADMIN_SECRET` to `.env.example` with inline comments (note: `KEYCLOAK_ADMIN_SECRET` must NOT be prefixed `VITE_`)
- [x] T003 [P] Add `'login' | 'signup'` to `Screen` union type in `src/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Keycloak context and `useAuth` hook — every user story depends on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create `src/lib/keycloak.ts`: declare a module-level `Keycloak` singleton using `new Keycloak({ url: import.meta.env.VITE_KEYCLOAK_URL, realm: import.meta.env.VITE_KEYCLOAK_REALM, clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID })`
- [x] T005 Add `KeycloakContext` (React context) and `KeycloakProvider` component to `src/lib/keycloak.ts`; initialize the singleton inside a `useEffect` guarded by a `useRef` flag to prevent double-init in React 19 Strict Mode; persist `accessToken` + `refreshToken` + `idToken` + `expiresAt` to `sessionStorage` key `blitzpay_session` on successful init
- [x] T006 Add `useAuth()` hook to `src/lib/keycloak.ts` exposing `{ initialized, authenticated, token, user, login, logout }` — `login(email, password)` performs an ROPC `fetch` POST to `/realms/{realm}/protocol/openid-connect/token` with `grant_type=password`; `user` is derived by decoding the ID token claims; `logout()` clears `sessionStorage` and calls `keycloak.logout()`
- [x] T007 Wrap `<App />` with `<KeycloakProvider>` in `src/main.tsx`, placing it **outside** `<React.StrictMode>` to avoid double-initialization

**Checkpoint**: `useAuth()` is importable; `initialized` becomes `true` on app load; unauthenticated state is detected.

---

## Phase 3: User Story 1 — Email/Password Login (Priority: P1) 🎯 MVP

**Goal**: Returning users can log in with email and password; the app gates all existing screens behind authentication.

**Independent Test**: Launch app → Login screen appears (not Explore); enter valid credentials from a test Keycloak user → Explore screen loads. Enter wrong password → inline error shown. No crash on network failure.

### Implementation

- [x] T008 [US1] Add auth gating to `src/App.tsx`: import `useAuth`; if `!initialized` keep showing `SplashScreen`; if `initialized && !authenticated` force render of the Login screen regardless of `currentScreen` state; add `'login'` and `'signup'` to the `showHeader`, `showBottomNav`, and `showFloatingAvatar` exclusion arrays
- [x] T009 [P] [US1] Add auth translation keys to `src/lib/translations.ts` (both `de` and `en`): `log_in`, `email`, `password`, `show_password`, `hide_password`, `forgot_password`, `no_account`, `sign_up_link`, `wrong_credentials`, `account_locked`, `session_expired`, `network_error`
- [x] T010 [P] [US1] Create `src/screens/Login.tsx`: layout — BlitzPay logo/wordmark (centred, top 40%), email `<input>` with `rounded-xl bg-surface-container` styling, password `<input>` with Eye/EyeOff show-hide toggle using `lucide-react`; props: `onLoginSuccess: () => void`, `onNavigateToSignup: () => void`
- [x] T011 [US1] Add "Log In" primary CTA to `src/screens/Login.tsx`: calls `login(email, password)` from `useAuth()`; button shows `animate-spin` spinner from Motion while `isLoading`; displays inline error (`text-red-500`) below the button on failure using the error message keys from T009; button is `bg-primary text-white rounded-2xl w-full` matching app style
- [x] T012 [US1] Add "Forgot password?" text link and "Don't have an account? Sign Up" link to `src/screens/Login.tsx`; "Forgot password?" calls `keycloak.login({ action: 'UPDATE_PASSWORD' })` (imported from `src/lib/keycloak.ts`); "Sign Up" calls `onNavigateToSignup()`; wrap entire screen in `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`
- [x] T013 [US1] Add `'login'` and `'signup'` cases to `renderScreen()` in `src/App.tsx`: `'login'` renders `<Login onLoginSuccess={() => setCurrentScreen('explore')} onNavigateToSignup={() => setCurrentScreen('signup')} />`; `'signup'` renders `<Signup ... />` (placeholder component until Phase 4); import both screens

**Checkpoint**: Full email/password login flow works end-to-end. Auth gate prevents access to Explore without a session. Sessions survive page refresh (sessionStorage). Session expiry redirects back to Login with "Session expired" message.

---

## Phase 4: User Story 2 — New Account Signup (Priority: P2)

**Goal**: New users can create an account from within the app using a form that matches the BlitzPay design system.

**Independent Test**: Tap "Sign Up" from Login → Signup screen appears; fill valid details → account created in Keycloak → auto-logged in → Explore screen. Duplicate email → inline error with "Log in instead" link. Mismatched passwords → client-side error before submission.

### Implementation

- [x] T014 [US2] Create `server.ts` at project root: set up Express app, add `POST /api/register` route; the route (a) validates `{ name, email, password }` from `req.body`, (b) obtains a Keycloak admin access token via client credentials grant using `KEYCLOAK_ADMIN_SECRET` (env var, not exposed to browser), (c) posts to `POST {KEYCLOAK_URL}/admin/realms/{realm}/users` with `{ username: email, email, firstName: name, enabled: true, credentials: [{ type: 'password', value: password, temporary: false }] }`, (d) returns 201 `{ userId }` on success, 409 `{ error: 'email_conflict' }` on duplicate, 422 `{ error: 'validation_failed' }` on bad input, 500 `{ error: 'server_error' }` otherwise; add `"server": "tsx server.ts"` script to `package.json`
- [x] T015 [P] [US2] Add signup translation keys to `src/lib/translations.ts` (both `de` and `en`): `create_account`, `full_name`, `confirm_password`, `already_have_account`, `log_in_link`, `email_conflict`, `password_hint`, `passwords_do_not_match`, `registration_failed`
- [x] T016 [P] [US2] Create `src/screens/Signup.tsx`: layout — back arrow (left-aligned, calls `onNavigateToLogin()`), "Create Account" heading in Manrope bold, inputs for Full Name / Email / Password / Confirm Password (`rounded-xl bg-surface-container`); props: `onSignupSuccess: () => void`, `onNavigateToLogin: () => void`
- [x] T017 [US2] Add client-side validation to `src/screens/Signup.tsx`: password must be ≥8 chars, contain ≥1 uppercase letter, ≥1 digit; passwords must match; show inline hint text below each failing field; "Create Account" CTA button (`bg-primary rounded-2xl w-full`) is disabled until all validations pass; button shows spinner while `isLoading`
- [x] T018 [US2] Add submit handler to `src/screens/Signup.tsx`: `fetch('POST /api/register', { name, email, password })`; on 201 immediately call `login(email, password)` from `useAuth()` then `onSignupSuccess()`; on 409 show "An account with this email already exists. [Log in instead]" where "Log in instead" calls `onNavigateToLogin()`; on other errors show `registration_failed` message

**Checkpoint**: Signup → auto-login → Explore works end-to-end. Duplicate email shows correct error. Signup and Login screens navigate between each other correctly.

---

## Phase 5: User Story 3 — Face ID Biometric Login (Priority: P3)

**Goal**: Returning users on Face ID-capable devices can log in biometrically without typing credentials.

**Independent Test**: On iOS 14+ Safari, after first email/password login: enrollment prompt appears → complete Face ID enrollment → log out → Face ID button appears on Login screen → tap → Face ID scan → lands on Explore. On non-biometric device: Face ID button not shown.

### Implementation

- [x] T019 [US3] Extend `useAuth()` in `src/lib/keycloak.ts`: add `isWebAuthnAvailable: boolean` state (resolved at mount via `await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`, defaults to `false` if API is unavailable); add `loginWithBiometric()` which calls `keycloak.login({ loginHint: user?.email })` pointing to the Keycloak WebAuthn passwordless authentication flow; add `enrollBiometric()` which triggers `keycloak.login({ action: 'webauthn-register-passwordless' })` (Application-Initiated Action)
- [x] T020 [US3] Add `BiometricEnrollmentFlag` storage to `src/lib/keycloak.ts`: after `enrollBiometric()` callback returns (detect via `keycloak.onAuthSuccess` or URL param), write `{ userId, enrolled: true, enrolledAt: ISO string }` to `localStorage` key `blitzpay_biometric_{userId}`; expose `biometricEnrolled: boolean` from `useAuth()`; read flag on init to set initial state
- [x] T021 [US3] Add Face ID button to `src/screens/Login.tsx`: shown only when `isWebAuthnAvailable && biometricEnrolled` (both from `useAuth()`); button uses a finger/face icon from `lucide-react` (ScanFace or Fingerprint) with label from translation key `face_id_login`; button calls `loginWithBiometric()`; add translation keys `face_id_login` and `enable_face_id` to `src/lib/translations.ts` (de + en)
- [x] T022 [US3] Trigger biometric enrollment offer in `src/App.tsx`: after successful login (when `authenticated` becomes `true` for the first time and `isWebAuthnAvailable && !biometricEnrolled`), show an inline dismissible prompt on the Explore screen ("Enable Face ID for faster login" with Accept/Dismiss buttons); Accept calls `enrollBiometric()`; Dismiss stores a `blitzpay_biometric_dismissed` flag in localStorage so the prompt never re-appears

**Checkpoint**: Face ID enrollment and login flow works on iOS 14+ Safari. Non-biometric devices show no Face ID UI. Password login remains unaffected.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, edge case handling, and consistency across all three stories.

- [x] T023 [P] Add token auto-refresh to `src/lib/keycloak.ts`: on `keycloak.onTokenExpired`, call `keycloak.updateToken(30)`; on refresh failure, clear `sessionStorage` and call a `onSessionExpired` callback that sets `currentScreen` to `'login'` with an error message via state in `src/App.tsx`; add `session_expired` toast/banner to `src/screens/Login.tsx`
- [x] T024 [P] Handle offline/unreachable Keycloak gracefully: in the ROPC `login()` fetch catch block in `src/lib/keycloak.ts`, distinguish network errors (`TypeError: Failed to fetch`) from Keycloak auth errors (HTTP 401/400) and surface the correct translation key (`network_error` vs `wrong_credentials`)
- [x] T025 Update `CLAUDE.md` to document the new `useAuth()` hook, the `'login'` and `'signup'` screen values, and the required Keycloak env vars so future Claude instances know about the auth layer

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T002 and T003 are parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — T009 and T010 are parallel with each other after T008
- **Phase 4 (US2)**: Depends on Phase 2 — T015 and T016 are parallel after T014
- **Phase 5 (US3)**: Depends on Phase 3 (needs Login screen to add Face ID button) — T019 and T020 can run in parallel
- **Phase 6 (Polish)**: Depends on Phases 3–5 completion — T023 and T024 are parallel

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no dependencies on US2 or US3
- **US2 (P2)**: Can start immediately after Phase 2 — depends on US1 Login screen existing only for the "Log in instead" navigation
- **US3 (P3)**: Depends on US1 Login screen (adds Face ID button to it) — otherwise independent

### Within Each User Story

- T008 (gating) must complete before T010/T011/T012 in US1 (sets up the render context)
- T014 (server endpoint) must complete before T017/T018 in US2 (form needs something to call)
- T019 (hook extensions) must complete before T021 (button needs `isWebAuthnAvailable`)

---

## Parallel Opportunities

### Phase 1
```
T002 (.env.example) ──┐
                      ├── run in parallel
T003 (types.ts)    ──┘
```

### Phase 3 (US1)
```
T008 (App.tsx gating) → T009 (translations) ──┐
                         T010 (Login layout) ──┼── run in parallel, then T011 → T012 → T013
```

### Phase 4 (US2)
```
T014 (server endpoint) → T015 (translations) ──┐
                          T016 (Signup layout) ──┴── run in parallel, then T017 → T018
```

### Phase 5 (US3)
```
T019 (useAuth extensions) ──┐
                             ├── run in parallel, then T021 → T022
T020 (enrollment flag)    ──┘
```

---

## Implementation Strategy

### MVP (User Story 1 only — ~8 tasks)

1. Complete Phase 1 (T001–T003)
2. Complete Phase 2 (T004–T007) — **cannot skip**
3. Complete Phase 3 US1 (T008–T013)
4. **STOP and validate**: Login → Explore works; wrong password shows error; page refresh keeps session
5. Demo or deploy this gate — app is now protected

### Incremental Delivery

1. MVP (above) → app has login gate
2. Add US2 (T014–T018) → users can self-register in-app
3. Add US3 (T019–T022) → Face ID available on supported devices
4. Polish (T023–T025) → session expiry handled, offline resilient

### Task Count Summary

| Phase | Tasks | Parallel tasks |
|-------|-------|---------------|
| Phase 1: Setup | 3 | 2 |
| Phase 2: Foundational | 4 | 0 |
| Phase 3: US1 Login | 6 | 2 |
| Phase 4: US2 Signup | 5 | 2 |
| Phase 5: US3 Face ID | 4 | 2 |
| Phase 6: Polish | 3 | 2 |
| **Total** | **25** | **10** |

---

## Notes

- No test tasks generated — this project has no test suite configured
- All Keycloak server setup (realm creation, client config, WebAuthn policy) is documented in `quickstart.md` and is a prerequisite, not an implementation task
- `KEYCLOAK_ADMIN_SECRET` must never appear in any `VITE_`-prefixed env var or client bundle
- Face ID (US3) only works on iOS 14+ Safari and desktop browsers with platform authenticators; Android biometrics via WebAuthn are also supported where available
