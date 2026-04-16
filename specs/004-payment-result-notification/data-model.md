# Phase 1 Data Model: Payment Result Notification with Polling Fallback

**Feature**: 004-payment-result-notification
**Date**: 2026-04-15

Entities are scoped to the mobile app. Backend-owned entities (the authoritative payment record, the Expo push recipient registry) are referenced but not modeled here — they live in the contracts.

## Entities

### PaymentRequest (backend-authoritative; client-side view)

Represents the payment the user just initiated. The mobile app only holds the subset it needs to display results.

| Field | Type | Notes |
|-------|------|-------|
| `paymentRequestId` | string (UUID) | Primary key. Supplied by backend at payment-create time. |
| `status` | enum | `pending \| processing \| succeeded \| failed \| cancelled`. Terminal set: `succeeded \| failed \| cancelled`. |
| `amount` | number (minor units) | Displayed on result screen. |
| `currency` | string (ISO 4217) | e.g. `"EUR"`. |
| `reason` | string? | Present on `failed` / `cancelled`; human-readable. |
| `updatedAt` | string (ISO 8601) | From backend; used to order signals if ever needed. |

**State transitions**:

```
pending ──► processing ──► succeeded
                    ├────► failed
                    └────► cancelled
```

Once terminal, the record is immutable. Client ignores any signal that tries to move a terminal status to another status.

---

### InFlightPaymentRecord (client-only, persisted)

A per-device record that a payment is awaiting a terminal status. Persisted in `expo-secure-store` under the key `blitzpay_inflight_payments` as a JSON array so we can recover from app kill/restart (FR-010).

| Field | Type | Notes |
|-------|------|-------|
| `paymentRequestId` | string | Primary key within the array. |
| `startedAt` | number (ms epoch) | Used to compute elapsed time against the max-wait window after restart. |
| `lastPolledAt` | number? (ms epoch) | Updated after each poll attempt; null if never polled. |
| `resolved` | boolean | Transient — set true when terminal signal arrives; record is removed from storage shortly after. |

**Invariants**:

- At most one record per `paymentRequestId`.
- Records older than `maxWaitMs * 2` on app launch are considered abandoned → one final status call; if still non-terminal, record is dropped (no indefinite polling across restarts).

---

### PaymentResultNotification (push payload shape; incoming)

The Expo push `data` payload delivered by the backend when a payment reaches a terminal status. Full contract in `contracts/push-notification-payload.md`.

| Field | Type | Notes |
|-------|------|-------|
| `type` | string literal `"payment_result"` | Discriminator; the app ignores notifications with other `type` values here. |
| `paymentRequestId` | string | Routes the signal to the correct tracker entry. |
| `status` | enum (terminal subset) | `succeeded \| failed \| cancelled`. |
| `reason` | string? | Failure/cancellation reason. |

---

### DevicePushRegistration (backend-authoritative; client sends)

Association between the authenticated user and the current device's Expo push token. Client POSTs this to the backend; backend persists it. Full contract in `contracts/push-registration-endpoint.md`.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | Keycloak subject (`sub` claim). |
| `expoPushToken` | string | e.g. `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`. |
| `platform` | enum | `ios \| android`. |
| `registeredAt` | string (ISO 8601) | Server sets. |
| `active` | boolean | Backend toggles false on token-invalid responses from Expo. |

Client idempotency: compare the locally cached token against the new one; only POST on change.

---

### TrackerState (in-memory, runtime only)

Runtime state inside `paymentResultTracker` — **not persisted, not shared across processes**.

| Field | Type | Notes |
|-------|------|-------|
| `paymentRequestId` | string | Key in the tracker map. |
| `startedAt` | number (ms epoch) | For backoff + max-wait arithmetic. |
| `pollController` | AbortController | Lets push cancel in-flight poll. |
| `pollTimer` | Timeout handle? | Next scheduled poll; null during a request or after resolution. |
| `resolved` | boolean | Guards against duplicate resolution (push+poll race). |
| `resolve` | `(PaymentResult) => void` | Fulfills the tracker's outward promise. |

## Relationships

```
User ─── (1:N) ─── DevicePushRegistration
User ─── (1:N) ─── PaymentRequest
PaymentRequest ─── (0:N) ─── PaymentResultNotification   (one per terminal event; client dedups)
PaymentRequest ─── (0:1) ─── InFlightPaymentRecord       (exists only while non-terminal on this device)
InFlightPaymentRecord ─── (1:1) ─── TrackerState         (while app process is alive)
```

## Validation rules (derived from spec)

- `paymentRequestId` must be a non-empty string before a tracker is started; callers that pass empty/null throw synchronously.
- A push notification with `type != "payment_result"` or `status` outside the terminal set is ignored by this feature's listener (may still be handled by other listeners).
- `reason` must not exceed 200 chars when displayed (truncate with ellipsis) — protects the result screen layout.
- Poll responses with unrecognized `status` values are treated as non-terminal (research decision #8).
- On resolution, `InFlightPaymentRecord` for the same `paymentRequestId` is removed before the UI transition is emitted, so an app kill immediately after resolution cannot cause a re-resolution on next launch.
