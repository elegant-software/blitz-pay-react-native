# Feature Specification: Authentication — Login, Signup & Biometric Access

**Feature Branch**: `001-keycloak-auth-login`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "I want to have log in screen with signup option, face Id recognotion also will be possible, I would like to use Keycloak SKD and same styling and ux with this app should be followed"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Email/Password Login (Priority: P1)

A returning user opens BlitzPay and is presented with a login screen styled consistently with the app's existing design. They enter their email and password, authenticate successfully, and land on the Explore (home) screen.

**Why this priority**: Core authentication gate. Every user must pass through this to access any feature. No other story is viable without this foundation.

**Independent Test**: Can be tested by launching the app without a stored session, entering valid credentials, and confirming the Explore screen is shown.

**Acceptance Scenarios**:

1. **Given** the user has a registered account, **When** they enter a valid email and password and tap "Log In", **Then** they are authenticated and navigated to the Explore screen.
2. **Given** the user enters an incorrect password, **When** they tap "Log In", **Then** an inline error message is shown and they remain on the login screen.
3. **Given** the user has not verified their email, **When** they attempt to log in, **Then** they see a clear message prompting them to verify before proceeding.
4. **Given** the login screen is open, **When** the user taps "Forgot Password", **Then** they are guided through a password reset flow.

---

### User Story 2 - New Account Signup (Priority: P2)

A new user opens BlitzPay for the first time and taps "Sign Up". They complete a short registration form (name, email, password), create their account, and are onboarded into the app.

**Why this priority**: User acquisition depends on self-service registration. Without it, new users cannot access the product.

**Independent Test**: Can be tested end-to-end in isolation by going through the signup flow and confirming account creation lands the user on the Explore screen.

**Acceptance Scenarios**:

1. **Given** the user is on the login screen, **When** they tap "Sign Up", **Then** a registration form is displayed in the same visual style.
2. **Given** the user fills in valid details and submits, **When** registration succeeds, **Then** they receive a confirmation prompt and are navigated to the Explore screen (or an email verification step).
3. **Given** the user enters an email already in use, **When** they submit, **Then** an inline error explains the conflict and suggests logging in instead.
4. **Given** the user enters a password that does not meet strength requirements, **When** they submit, **Then** clear guidance is shown on what is required.

---

### User Story 3 - Face ID Biometric Login (Priority: P3)

A returning user who has previously enrolled their biometrics can skip typing their credentials. On the login screen, they trigger Face ID, scan their face, and are authenticated and navigated to the Explore screen.

**Why this priority**: Convenience feature that significantly improves repeat-use experience. Does not block core access — password login is always available as a fallback.

**Independent Test**: Can be tested on a device supporting Face ID by enabling biometrics after first login, then relaunching the app.

**Acceptance Scenarios**:

1. **Given** the user has enabled Face ID after a prior successful login, **When** they open the app, **Then** a Face ID prompt is shown automatically or a biometric button is visible.
2. **Given** the Face ID scan succeeds, **When** biometric verification passes, **Then** the user is authenticated and navigated to the Explore screen without entering a password.
3. **Given** the Face ID scan fails or is cancelled, **When** the biometric check does not pass, **Then** the standard email/password form is shown as fallback.
4. **Given** the device does not support biometric authentication, **When** the login screen loads, **Then** the Face ID option is hidden and only password login is available.

---

### Edge Cases

- What happens when the user's session token expires mid-session? They are redirected to the login screen with a clear "Session expired" message.
- What happens if the identity provider is unreachable? The user sees a connection error and a retry option — no crash or blank screen.
- What happens when a user attempts to sign up but the network drops mid-submission? The form retains their input and shows a retry option.
- What happens if Face ID data is cleared on device (e.g., new face enrolled by someone else)? The app falls back to password login and prompts re-enrollment.
- What happens if the user hammers incorrect passwords repeatedly? Account lockout follows identity provider policy; the UI shows a lockout message with recovery guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a login screen as the app entry point when no active session exists.
- **FR-002**: System MUST allow users to authenticate with email and password via the Keycloak identity platform.
- **FR-003**: System MUST provide a "Sign Up" path from the login screen allowing new users to register with name, email, and password.
- **FR-004**: System MUST validate input fields inline (email format, password strength) before submission.
- **FR-005**: System MUST display clear, human-readable error messages for all failure states (wrong credentials, account locked, network error, email already in use).
- **FR-006**: System MUST offer a "Forgot Password" recovery flow accessible from the login screen.
- **FR-007**: System MUST support Face ID biometric authentication as an optional alternative login method on capable devices.
- **FR-008**: System MUST always provide the email/password form as a fallback when biometric authentication is unavailable or fails.
- **FR-009**: System MUST allow users to opt in to Face ID after their first successful password login.
- **FR-010**: System MUST redirect unauthenticated users attempting to access the app back to the login screen.
- **FR-011**: System MUST apply the BlitzPay visual design system (colours, typography, corner radii, spacing, animations) consistently across all authentication screens.
- **FR-012**: System MUST handle session expiry gracefully by redirecting to the login screen with an explanatory message.

### Key Entities

- **User Account**: Represents a registered BlitzPay user. Key attributes: name, email address, account status (active / pending verification / locked).
- **Session**: Represents an authenticated session. Has an expiry time; drives access control throughout the app.
- **Biometric Enrollment**: Represents a user's opt-in to Face ID on a given device. Linked to a user account; scoped per device.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login flow (open app → authenticated → Explore screen) in under 20 seconds on a standard mobile connection.
- **SC-002**: Users can complete the full signup flow from start to landing on the Explore screen in under 3 minutes.
- **SC-003**: Face ID authentication, once enrolled, completes in under 3 seconds on supported devices.
- **SC-004**: 95% of login attempts succeed on the first try for users entering correct credentials.
- **SC-005**: All authentication screens are visually consistent with the existing app screens (same design token usage, spacing, and animation style).
- **SC-006**: Users who encounter an authentication error can understand what went wrong and what to do next without contacting support.

## Assumptions

- Users access BlitzPay primarily on mobile devices (iOS and Android); the authentication screens are designed mobile-first.
- Keycloak is the designated identity provider; all credential validation, token issuance, session management, and password reset are delegated to it.
- Face ID biometric support uses the device's native biometric capability; actual biometric data never leaves the device.
- Email verification after signup is required before first login; this step is handled by Keycloak's built-in email verification flow.
- A user can only have one account per email address.
- Biometric enrollment is per-device; enrolling Face ID on one device does not affect the user's experience on another device.
- The existing splash screen precedes the authentication check — if no valid session is found after the splash, the login screen is shown.
- Password reset emails are sent by Keycloak; the app only triggers the reset flow and displays a confirmation to the user.
