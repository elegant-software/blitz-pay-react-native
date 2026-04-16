# Feature Specification: Payment Result Notification with Polling Fallback

**Feature Branch**: `004-payment-result-notification`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "after payment we will recieve expo push notification for the result and if we do not recieve it as fall back we need to call GET /v1/payments/{paymentRequestId}"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Near-instant payment result via push notification (Priority: P1)

After a user authorizes a payment in the mobile app (e.g., via bank redirect / TrueLayer flow), the app shows a "processing" state. As soon as the backend confirms the outcome (success, failure, cancelled), the user's device receives a push notification carrying the payment result and the result screen updates automatically — without the user having to refresh or tap anything.

**Why this priority**: This is the primary happy-path experience. Users expect immediate feedback that their money moved. Without it, they may retry payments (creating duplicates) or abandon the flow. Push delivery is the fastest, most battery-friendly path.

**Independent Test**: Initiate a payment end-to-end, keep the device idle on the "processing" screen with push permissions granted, and verify that within a few seconds of backend confirmation the screen transitions to the correct outcome (paid / failed / cancelled) based solely on the push notification payload.

**Acceptance Scenarios**:

1. **Given** a user has just authorized a payment and is on the processing screen with push notifications enabled, **When** the backend finalizes the payment as successful, **Then** the device receives a push notification and the app transitions to the success result screen showing amount, merchant, and reference.
2. **Given** the same setup, **When** the backend finalizes the payment as failed or cancelled, **Then** the app transitions to the matching failure/cancelled result screen with a human-readable reason.
3. **Given** the app is backgrounded or the screen is locked during processing, **When** the push notification arrives, **Then** tapping the notification deep-links the user directly to the correct result screen for that payment.

---

### User Story 2 - Polling fallback when push does not arrive (Priority: P1)

If the push notification does not reach the device within a short window (e.g., notifications disabled, device offline, APNs/FCM delay, token not registered, silent push dropped), the app must not leave the user stranded on "processing". The app falls back to polling the payment status endpoint (`GET /v1/payments/{paymentRequestId}`) until a terminal outcome is known or a maximum wait is exceeded.

**Why this priority**: Push delivery is best-effort — carrier issues, OS throttling, disabled permissions, or a user who never granted notification rights would otherwise leave the payment in limbo. Polling guarantees every user eventually sees their result, making the feature resilient and trustworthy.

**Independent Test**: Simulate "no push ever arrives" (e.g., revoke notification permission or block the push channel) after initiating a payment, and verify that the app independently reaches the correct terminal result within the maximum wait window and displays it to the user.

**Acceptance Scenarios**:

1. **Given** a payment has been authorized and no push notification has arrived after the initial wait window, **When** the fallback activates, **Then** the app queries the payment status endpoint on a backoff schedule until it receives a terminal status.
2. **Given** polling returns a terminal status (succeeded / failed / cancelled), **When** that response is received, **Then** the app transitions to the matching result screen and stops polling.
3. **Given** the user has push notifications disabled at the OS level, **When** they complete a payment, **Then** they still see the correct outcome within the same maximum wait window, purely through polling.
4. **Given** both a push notification and a polling response eventually arrive for the same payment, **When** the second one is processed, **Then** the UI is not disrupted and no duplicate result screens or duplicate analytics events are produced.

---

### User Story 3 - Graceful handling when no result is obtained within the max wait (Priority: P2)

If neither push nor polling yields a terminal status within the maximum wait window (e.g., extended bank/processor outage), the user is shown a clear "still processing" state with guidance (e.g., "We'll notify you as soon as we hear back — check Invoices for updates") rather than an indefinite spinner or a misleading success/failure.

**Why this priority**: This is an edge case but critical for trust. Leaving a user indefinitely on a spinner — or worse, defaulting to "failed" — causes duplicate payments and support tickets.

**Independent Test**: Force the backend to never finalize a given payment during the test window and verify the app exits the processing screen to a "pending / we'll let you know" state at exactly the max wait threshold, with no false success or false failure shown.

**Acceptance Scenarios**:

1. **Given** the max wait window elapses with no terminal status from either source, **When** the timeout fires, **Then** the app shows a "payment still processing" state and allows the user to continue using the app.
2. **Given** the user lands on that pending state, **When** a terminal result later arrives (via push or a later status check, e.g., from the invoices screen), **Then** the user is notified and the payment's final status is reflected consistently.

---

### Edge Cases

- Push notification arrives for a payment the user has already navigated away from — the app must still update that payment's stored status and show the result if the user re-enters the flow.
- Duplicate push notifications (same payment, same status) — must be de-duplicated so no double-counted events or flicker.
- Push arrives *before* the processing screen has fully mounted — the result must not be lost; the app must apply it once ready.
- Polling response arrives *after* push has already delivered a terminal status — must be treated as a no-op.
- Device loses network during polling — retries with backoff; does not surface transient errors as payment failures.
- Status endpoint returns a non-terminal status (e.g., still `pending`) — polling continues; not treated as failure.
- Status endpoint returns an unexpected/unknown status — treat as non-terminal and continue polling until timeout, then fall through to the "still processing" state.
- User kills the app during processing — on next launch, any in-flight payment must be resolved (via a fresh status check) before being shown in history.
- Notification permissions revoked mid-session — subsequent payments automatically rely on polling without user-facing errors.
- Two payments initiated in quick succession — each tracked independently by its `paymentRequestId`; notifications and polling responses are routed to the correct payment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST deliver a push notification to the paying user's device as soon as a payment reaches a terminal status (succeeded, failed, cancelled).
- **FR-002**: The push notification payload MUST identify the specific payment (by its payment request identifier) and the terminal status, so the app can update the correct payment without further lookups when it has enough context.
- **FR-003**: The mobile app MUST register the device for push notifications at sign-in (or first launch after granting permission) and MUST tolerate missing permissions without crashing or blocking payments.
- **FR-004**: While a payment is in the "processing" state, the app MUST listen for incoming push notifications scoped to that payment and update the UI on receipt.
- **FR-005**: If no terminal-status push notification is received within the initial wait window, the app MUST automatically begin polling the payment status endpoint for that `paymentRequestId` as a fallback.
- **FR-006**: Polling MUST use a backoff schedule to avoid hammering the server and MUST stop immediately upon receiving either (a) a terminal status from the endpoint or (b) a terminal-status push notification.
- **FR-007**: Polling MUST stop at the maximum wait window, after which the user is shown a "still processing / we'll notify you" state.
- **FR-008**: The app MUST de-duplicate terminal-status signals so that receiving both a push and a polling response for the same payment results in exactly one state transition and one analytics event.
- **FR-009**: Tapping a payment result push notification MUST deep-link the user to the result screen for that specific payment, regardless of whether the app was foreground, backgrounded, or terminated.
- **FR-010**: The app MUST persist in-flight payment identifiers so that payments initiated before an app kill/restart are resolved on next launch by querying the status endpoint.
- **FR-011**: The system MUST correctly handle multiple concurrent in-flight payments by routing each notification and each polling response to the correct `paymentRequestId`.
- **FR-012**: Non-terminal or unknown statuses returned by the status endpoint MUST NOT be presented to the user as failures; polling continues until a terminal status or timeout.
- **FR-013**: Users who have denied push notification permission MUST still receive the correct payment outcome via polling within the same maximum wait window.
- **FR-014**: The feature MUST NOT trigger a second payment attempt under any circumstance — push loss, polling error, or timeout only affect how the result is *observed*, never whether the payment is re-submitted.

### Key Entities *(include if feature involves data)*

- **Payment Request**: Represents a single initiated payment. Key attributes: unique payment request identifier, current status (processing / succeeded / failed / cancelled / unknown), amount, merchant/recipient reference, created timestamp, last-updated timestamp.
- **Payment Result Notification**: A push message delivered to the paying user's device. Key attributes: target payment request identifier, terminal status, human-readable reason (for failure/cancellation), deep-link target.
- **Device Push Registration**: Association between an authenticated user and a device-specific push token, used by the backend to route result notifications. Key attributes: user identifier, push token, platform, registration timestamp, active flag.
- **In-Flight Payment Record**: Local, per-device record of payments awaiting a terminal status, used to drive polling and app-restart recovery. Key attributes: payment request identifier, started-at timestamp, last-polled-at timestamp, resolved flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In at least 95% of successful payments, the user sees the terminal result within 5 seconds of the backend finalizing the payment, via push notification alone.
- **SC-002**: 100% of users (including those with push notifications disabled or delayed) see a terminal payment result within the maximum wait window of 60 seconds after backend finalization, via the polling fallback.
- **SC-003**: Zero users are left on an indefinite "processing" spinner — every in-flight payment exits the processing state within the maximum wait window to either a terminal result screen or a clearly-communicated "still processing" state.
- **SC-004**: Duplicate result signals (push + polling for the same payment) produce exactly one user-visible state transition and one analytics event in 100% of observed cases.
- **SC-005**: Support tickets citing "I paid but the app never confirmed" drop by at least 80% compared to the pre-feature baseline within the first month after rollout.
- **SC-006**: No measurable increase in duplicate payments attributable to this feature (target: 0 duplicate payments caused by users retrying due to missing result feedback).

## Assumptions

- The backend already emits (or will emit) a payment-result event suitable for delivery as a push notification keyed by `paymentRequestId`, and exposes the status endpoint `GET /v1/payments/{paymentRequestId}` returning the authoritative current status.
- The initial wait window before polling begins is assumed to be ~5 seconds, and the maximum wait window is assumed to be 60 seconds, aligned with typical bank-redirect confirmation latency. These values can be tuned without changing the spec.
- Polling backoff starts at roughly 2 seconds and grows (e.g., 2s → 3s → 5s → 8s …) up to the max wait window, balancing responsiveness against server load.
- This feature targets the mobile app (`/mobile` Expo project). The web prototype is out of scope for v1.
- Push notification delivery uses the Expo push service already available to the mobile app; backend infrastructure to send those pushes is a dependency owned by the backend team.
- Users are authenticated at the time of payment, so the backend can always resolve which device(s) to notify for a given `paymentRequestId`.
- "Terminal status" is defined as succeeded, failed, or cancelled. Any other value (pending, processing, unknown) is non-terminal.
- Network connectivity may be intermittent; polling tolerates transient failures without surfacing them as payment failures.
