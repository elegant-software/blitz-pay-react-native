# Phase 0 Research: Payment Result Notification with Polling Fallback

**Feature**: 004-payment-result-notification
**Date**: 2026-04-15

This document resolves the unknowns from the plan's Technical Context and captures the key technical decisions. All items below had to be settled before Phase 1 design.

## 1. Push delivery channel: Expo Push Service

- **Decision**: Use Expo Push Service (`expo-notifications` + Expo's server-side send API) for result delivery, with a `data`-only (silent-capable) payload so the app can update UI even when not foregrounded.
- **Rationale**: The mobile app is Expo-managed (SDK 52). Expo push is the shortest path — no native APNs/FCM credential plumbing to own in the prototype. The feature description explicitly names Expo.
- **Alternatives considered**:
  - Direct APNs + FCM per platform: more control, but requires cert/key management and two codepaths. Overkill for a prototype.
  - Server-sent events / WebSocket: works in foreground but doesn't wake the app from background; still needs a fallback. Push covers both states.

## 2. Fallback trigger timing

- **Decision**: Initial wait = 5 seconds after payment authorize before polling starts. Max wait = 60 seconds total from authorize. Backoff schedule: 2s, 3s, 5s, 8s, 13s, 21s (Fibonacci-ish, capped at max wait).
- **Rationale**: TrueLayer bank-redirect confirmations typically land within 2–10 seconds; 5s gives push the fair headstart it deserves without making users wait. 60s total upper bound keeps the worst case bounded while staying under typical processor SLAs. Backoff keeps the request count ≤10 per payment.
- **Alternatives considered**:
  - Start polling immediately (0s): wastes requests; push almost always wins.
  - Fixed 3s polling interval: simpler but up to 20 requests/minute per payment — unnecessary server load.
  - Poll once at 30s: too slow for user feedback, and produces an awkward 30s gap with no UI update.

## 3. Push payload shape

- **Decision**: Expo `data` payload containing `{ type: "payment_result", paymentRequestId, status, reason? }`. Include a minimal `title`/`body` so the OS shows a notification even if the app is killed; on tap, deep-link to the result screen for that `paymentRequestId`.
- **Rationale**: `paymentRequestId` + `status` let the app update state without any extra network round-trip — faster UX. The `reason` field is optional and only present for failure/cancellation.
- **Alternatives considered**:
  - Push carries only `paymentRequestId` and the app re-fetches: adds latency and defeats the whole point of push.
  - Push carries the full payment object: leaks payment details into OS notification storage/logs; unnecessary.

## 4. De-duplication strategy for push+poll race

- **Decision**: A single in-memory `paymentResultTracker` keyed by `paymentRequestId`. The first terminal signal (whichever arrives first — push or poll) resolves the tracker's promise and sets a "resolved" flag; subsequent signals for the same `paymentRequestId` are dropped with a debug log.
- **Rationale**: Simple, correct, no distributed coordination needed because both signals land on the same device process. One source of truth per payment.
- **Alternatives considered**:
  - Reconcile by comparing statuses: adds complexity for zero benefit (status is monotonic once terminal).
  - Let both signals update state and deduplicate at the analytics layer: risks duplicate screen transitions (flicker).

## 5. Persistence of in-flight payments

- **Decision**: Persist `{ paymentRequestId, startedAt }` records to `expo-secure-store` under the key `blitzpay_inflight_payments`. On app launch, the tracker reads this list and resolves each via a single `GET /v1/payments/{id}` call; resolved entries are removed.
- **Rationale**: If the user kills the app mid-payment, we must still surface the correct outcome on next launch (FR-010). Secure storage keeps the list out of plaintext app containers.
- **Alternatives considered**:
  - `AsyncStorage`: works but less appropriate for anything payment-adjacent; secure-store is already used for tokens.
  - SQLite/WatermelonDB: heavy for a prototype; a JSON blob of at most a handful of in-flight ids is enough.

## 6. Push token registration lifecycle

- **Decision**: Register the Expo push token with the backend (via a new `POST /v1/devices/push-token` call owned by backend) at two points: (a) immediately after successful sign-in in `keycloak.ts` auth callback, and (b) when permission is granted later (if the user initially declined). The token is stored alongside the user id in secure-store for idempotency.
- **Rationale**: Register-on-login matches existing auth flow and guarantees every authenticated user has a current token. Re-registering on permission-grant handles users who allow notifications mid-session.
- **Alternatives considered**:
  - Register once per app install: misses reinstalls and logout/login on a different account.
  - Register on every app launch: unnecessary chatter with backend.

## 7. Status endpoint contract (authoritative)

- **Decision**: `GET /v1/payments/{paymentRequestId}` returns `{ paymentRequestId, status, amount, currency, reason?, updatedAt }` where `status ∈ { pending, processing, succeeded, failed, cancelled }`. Terminal = `succeeded | failed | cancelled`. Auth: bearer token from Keycloak session.
- **Rationale**: Mirrors the TrueLayer payment status model we already surface in the prototype and gives the app everything it needs without a second call.
- **Alternatives considered**:
  - Long-poll variant of the endpoint: server-side complexity; push already covers "push the result out" use case.

## 8. Handling non-terminal / unknown polling responses

- **Decision**: Any non-terminal status (`pending`, `processing`, or unrecognized) continues the polling loop until max wait. On max wait, transition UI to a "still processing" state; do not show failure.
- **Rationale**: Prevents false-negative failures that would lead users to retry and duplicate payments (violates FR-014, SC-006).
- **Alternatives considered**:
  - Treat `unknown` as failure after N attempts: risky — an API field the backend adds later would be misread as failure.

## 9. Deep-link routing for notification taps

- **Decision**: Register a React Navigation `linking` config mapping `blitzpay://payments/:paymentRequestId/result` to the `PaymentResult` screen. Expo notification tap handler parses `data.paymentRequestId` and calls `Linking.openURL` with that path, or navigates directly if the app is already foreground.
- **Rationale**: Same mechanism whether the app was cold-started, background, or foreground; React Navigation handles the state merge.
- **Alternatives considered**:
  - Custom imperative nav stack manipulation: fragile against cold-start races.

## 10. Network resilience during polling

- **Decision**: Wrap each status call in a try/catch; transient errors (network offline, 5xx, timeout >8s) are logged and the loop continues with the next backoff step. Only a terminal HTTP semantic (e.g., 404 — payment request not found) surfaces an error to the UI.
- **Rationale**: Intermittent connectivity must not masquerade as a failed payment.
- **Alternatives considered**:
  - Fail fast on any network error: unacceptable UX on flaky networks.

## 11. Observability

- **Decision**: Emit analytics events: `payment_result_push_received`, `payment_result_poll_terminal`, `payment_result_timeout`, `payment_result_duplicate_suppressed`. Tracker logs winner source (push vs poll) for every resolved payment.
- **Rationale**: Lets us measure SC-001 (≥95% push-delivered within 5s) and SC-004 (dedup correctness) in production.
- **Alternatives considered**: None — observability is a soft requirement baked into SC-001/005.

## Open items carried into Phase 1

None. All NEEDS CLARIFICATION items from the plan's Technical Context resolved above.
