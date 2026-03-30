# Feature Specification: React Native Migration — BlitzPay Mobile POC

**Feature Branch**: `002-react-native-migration`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "I would like to convert this project into react native checkout main and do migration I want to use it as prototype and rapid development purpose to do POC at future"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core App Shell & Navigation (Priority: P1)

A developer or stakeholder opens the BlitzPay React Native app on a physical iOS or Android device (or simulator). They see the splash screen, land on the Explore home screen, and can navigate between the four main tabs (Explore, Assistant, Vault, Account) using the bottom navigation bar. The visual appearance closely mirrors the existing web prototype.

**Why this priority**: Without a working app shell and navigation, nothing else can be demonstrated. This is the foundation every other story builds on and the minimum needed to show stakeholders the app is running natively.

**Independent Test**: Install the app on a device → splash screen appears → Explore screen loads → tap each bottom nav tab → each screen renders without crashing.

**Acceptance Scenarios**:

1. **Given** the app is installed on iOS or Android, **When** it is launched, **Then** the splash screen animates and transitions to the Explore screen within 3 seconds.
2. **Given** the app is on the Explore screen, **When** the user taps each bottom navigation tab, **Then** the corresponding screen (Explore, Assistant, Vault, Account) loads and the active tab is highlighted.
3. **Given** any screen is open, **When** the user navigates away and back, **Then** screen transitions are smooth and visually consistent with the web prototype's motion style.
4. **Given** the app is running, **When** viewed on both iOS and Android, **Then** the layout, colours, typography, and spacing match the BlitzPay design system.

---

### User Story 2 - Authentication Flow (Priority: P2)

A user opens the app and is prompted to log in. They can enter their email and password to authenticate via Keycloak, or use native Face ID / Fingerprint (biometric) if they have enrolled previously. After login they land on Explore. They can log out from the Account screen.

**Why this priority**: The auth layer is already built for the web version and must carry over to native. POC stakeholders need to demonstrate a secure, real login — not a bypass — when showcasing to clients.

**Independent Test**: Launch app with no stored session → Login screen appears → enter valid credentials → land on Explore. Tap Account → Sign Out → Login screen reappears.

**Acceptance Scenarios**:

1. **Given** no active session exists, **When** the app launches, **Then** the Login screen is shown instead of Explore.
2. **Given** the Login screen is open, **When** the user enters valid credentials and taps Log In, **Then** they are authenticated and navigated to Explore.
3. **Given** the device supports biometric authentication (Face ID / Fingerprint), **When** the user has enrolled, **Then** a biometric login button is shown and tapping it authenticates without a password.
4. **Given** the user is logged in, **When** they tap Sign Out on the Account screen, **Then** the session is cleared and the Login screen is shown.

---

### User Story 3 - Merchant Discovery & Checkout Flow (Priority: P3)

A user browses merchants on the Explore screen, taps into a merchant detail page, and initiates a payment through the checkout screen. The checkout flow matches the existing web prototype including payment method selection.

**Why this priority**: The payment/checkout flow is the core commercial demonstration of BlitzPay. POC presentations centre around showing a complete end-to-end purchase journey on a real device.

**Independent Test**: From Explore → tap a merchant card → Merchant detail loads → tap Pay Now → Checkout screen loads with payment methods → tap Confirm → success animation plays → navigates to Vault.

**Acceptance Scenarios**:

1. **Given** the Explore screen is open, **When** the user taps a merchant card, **Then** the Merchant detail screen opens with the merchant's information.
2. **Given** the Merchant screen is open, **When** the user taps Pay Now, **Then** the Checkout screen loads showing payment method options.
3. **Given** the Checkout screen is open, **When** the user selects a payment method and confirms, **Then** a success animation plays and the user is taken to the Vault screen.
4. **Given** the checkout flow completes, **When** the success reward animation finishes, **Then** the Vault screen shows updated with a record of the transaction.

---

### User Story 4 - QR Code & Invoice Flows (Priority: P4)

A user can display their own QR code for merchants to scan, use the device camera to scan a merchant's QR code, send an invoice to contacts, and view and pay pending invoices.

**Why this priority**: These features differentiate BlitzPay from standard payment apps and are key POC talking points. The native camera access for QR scanning is a meaningful improvement over the web version.

**Independent Test**: From Explore quick actions → tap My QR → QR code displayed. Tap Scan QR → camera opens → scan a test QR → merchant detail loads.

**Acceptance Scenarios**:

1. **Given** the Explore screen is open, **When** the user taps My QR, **Then** their personal QR code is displayed full-screen.
2. **Given** the user taps Scan QR, **When** the camera permission is granted, **Then** the device camera opens in a scanner view and detects QR codes.
3. **Given** the Invoices screen is open, **When** the user taps Pay on a pending invoice, **Then** the Checkout flow opens pre-populated with the invoice amount.
4. **Given** the Send Invoice screen is open, **When** the user fills in recipients and items and submits, **Then** the invoice is sent and a confirmation is shown.

---

### Edge Cases

- What happens when the device has no internet connection? The app shows a clear offline message rather than crashing or hanging indefinitely.
- What happens when camera permission is denied for QR scanning? The app shows an explanation and a link to device settings to grant permission.
- What happens when the app is backgrounded mid-login? The session state is preserved and the user is not forced to re-enter credentials.
- What happens when the app is run on an older device with limited performance? Animations degrade gracefully (reduced motion) rather than causing jank.
- What happens if Keycloak is unreachable? The Login screen shows a network error message with a retry option.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mobile app MUST include all screens present in the current web prototype: Splash, Login, Signup, Explore, Merchant, Checkout, Assistant, Vault, Account, My QR Code, QR Scanner, Invoices, Send Invoice, Notifications.
- **FR-002**: The app MUST support both iOS (14+) and Android (API level 26+) from a single shared codebase.
- **FR-003**: The app MUST replicate the BlitzPay design system (colours, typography, spacing, corner radii, animations) as closely as practically possible on native platforms.
- **FR-004**: The app MUST authenticate users via Keycloak using email/password login (the same Keycloak instance used by the web prototype).
- **FR-005**: The app MUST support native biometric authentication (Face ID on iOS, Fingerprint on Android) as an optional login method.
- **FR-006**: The app MUST use the device's native camera for QR code scanning — not a simulated web camera view.
- **FR-007**: The app MUST implement bottom tab navigation matching the existing four-tab structure (Explore, Assistant, Vault, Account).
- **FR-008**: The app MUST support both English and German languages using the same translation keys as the web version.
- **FR-009**: The app MUST preserve the auth bypass mode (equivalent of `VITE_AUTH_BYPASS`) for developer/POC demos that don't require a live Keycloak server.
- **FR-010**: The app MUST be runnable via a standard development command on macOS for iOS Simulator and Android Emulator without additional manual configuration.
- **FR-011**: The existing web prototype on the `main` branch MUST remain fully intact and unmodified — the React Native app is a new parallel project, not a replacement.

### Key Entities

- **Screen**: Represents a navigable view in the app. The set of screens is identical to the web prototype.
- **Navigation State**: The currently active screen and navigation history. Managed by a mobile navigation library rather than custom `useState`.
- **Auth Session**: Identical to the web version — Keycloak tokens stored securely on-device (secure storage rather than sessionStorage).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 13 screens from the web prototype are present and navigable in the React Native app without crashes on both iOS and Android.
- **SC-002**: A developer with the repository can run the app on an iOS Simulator or Android Emulator with a single command within 5 minutes of cloning.
- **SC-003**: The complete end-to-end POC demo flow (launch → login → browse merchant → checkout → success) can be completed in under 2 minutes on a physical device.
- **SC-004**: Visual parity with the web prototype is at least 90% — same colours, fonts, spacing, and key animations visible to a stakeholder in a side-by-side comparison.
- **SC-005**: The app runs without crashes or freezes during a 10-minute continuous demo session covering all four main tab areas.
- **SC-006**: Native QR scanning works on a physical device without requiring any third-party hardware or special setup.

## Assumptions

- The React Native app will live in a new directory (e.g., `/mobile`) within the same repository, keeping the existing web prototype at the root untouched.
- The same Keycloak server used for the web prototype will be reused — no new identity infrastructure is needed.
- This is a prototype/POC — production concerns (app store submission, push notifications, deep links, offline sync) are out of scope.
- Expo is the preferred development platform as it enables rapid iteration, over-the-air updates, and easy device testing without requiring a full native build environment for every developer.
- The existing shared business logic (translation keys, Keycloak auth flow, screen structure) will be reused as-is; only the UI layer changes from web to native primitives.
- Mock/hardcoded data for merchants, invoices, and transactions will be carried over from the web prototype — no real backend data layer is introduced in this migration.
- The AI Assistant screen (Gemini integration) is included in the screen inventory but its voice/transcription functionality is treated as a placeholder in the POC — full native audio integration is deferred.
