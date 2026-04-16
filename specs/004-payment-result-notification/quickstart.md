# Quickstart: Payment Result Notification with Polling Fallback

**Feature**: 004-payment-result-notification
**Audience**: Mobile engineer picking this up for implementation / QA tester verifying it.

## Prerequisites

- Working `/mobile` Expo dev environment per `CLAUDE.md` (`cd mobile && npm install`).
- A physical iOS or Android device (iOS Simulator does not receive real push notifications; Android Emulator with Google Play services does). Use Expo Go or a Dev Client build.
- Backend reachable at a URL exposed via `EXPO_PUBLIC_API_BASE_URL` with:
  - `GET /v1/payments/{paymentRequestId}` responding per `contracts/payment-status-endpoint.md`.
  - `POST /v1/devices/push-token` responding per `contracts/push-registration-endpoint.md`.
  - A way to trigger a payment-result Expo push (backend admin tool or a test script).
- A valid Keycloak user you can sign in as (or `EXPO_PUBLIC_AUTH_BYPASS=true` plus a stubbed status endpoint).

## One-time setup

1. Install the Expo notifications plugin (if not already present):
   ```bash
   cd mobile
   npx expo install expo-notifications expo-device
   ```
2. Add the plugin to `mobile/app.json`:
   ```json
   "plugins": [
     ["expo-notifications", { "sounds": [] }]
   ]
   ```
3. Create the Android channel `payments` with `IMPORTANCE_HIGH` at app bootstrap (handled in `pushRegistration.ts`).
4. Add env:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://<your-backend>
   ```

## Happy path — push delivery (P1 story 1)

1. Sign in to the mobile app. Grant the notification permission prompt.
   - Expected: the app silently registers the Expo push token with the backend (check network logs for `POST /v1/devices/push-token` returning 204).
2. Initiate a payment from the Checkout screen and complete the TrueLayer bank redirect.
3. Immediately background the app or leave the processing screen in foreground — either works.
4. On the backend, finalize the payment as `succeeded` (your test tool sends the Expo push).
5. **Expected**: within ~5s, the app's processing screen transitions to the success result screen showing the correct amount, merchant, and reference. If the app was backgrounded, a notification appears; tapping it deep-links to the same result screen.

## Fallback path — polling (P1 story 2)

1. In device settings, revoke notification permission for the app.
2. Initiate a payment and complete the bank redirect.
3. **Expected**: processing screen stays for ~5s, then the app begins polling `GET /v1/payments/{paymentRequestId}` with backoff (watch network logs: calls at ~5s, 8s, 13s, 21s, 34s since start, capped at 60s).
4. On the backend, finalize the payment as `failed` with a reason string.
5. **Expected**: on the next poll after finalization, the app transitions to the failure result screen with the correct reason. No further polling after the terminal response.

## Max-wait path — neither signal arrives (P2 story 3)

1. Initiate a payment as in the happy path, but do **not** finalize it on the backend.
2. Wait 60 seconds from authorize.
3. **Expected**: at T+60s, the app exits the spinner to a "payment still processing — we'll notify you" state with a CTA to the Invoices screen. No success and no failure screen is shown.
4. Later finalize the payment as `succeeded`. If permissions allow, the user receives a push; tapping it navigates them to the result screen.

## App-kill recovery (FR-010)

1. Initiate a payment and reach the processing screen.
2. Force-quit the app before the backend finalizes.
3. Finalize the payment on the backend as `succeeded`.
4. Cold-launch the app.
5. **Expected**: during bootstrap, the app finds the persisted in-flight record, calls `GET /v1/payments/{paymentRequestId}` once, sees the terminal status, and either navigates straight to the result screen or surfaces a toast/banner with the result, depending on where the user lands.

## Dedup verification (FR-008 / SC-004)

1. Initiate a payment, leave the app in foreground, and configure the backend test tool to send the push **and** let the app poll at the same time by delaying finalization 10s (push) and 12s (poll sees the terminal status).
2. **Expected**: exactly one transition to the result screen; the later signal is suppressed with a debug log line `payment_result_duplicate_suppressed`. Exactly one analytics `payment_result_poll_terminal` or `payment_result_push_received` event, never both for the same `paymentRequestId`.

## Success metric checks (mapped to spec SCs)

| SC | How to verify |
|----|---------------|
| SC-001 (≥95% push within 5s) | Aggregate `payment_result_push_received` latencies in analytics dashboard after rollout. |
| SC-002 (100% within 60s) | No `payment_result_timeout` events for payments that the backend did finalize within 60s. |
| SC-003 (no indefinite spinner) | Manual: run the max-wait path test above. |
| SC-004 (dedup) | Run the dedup verification above on every release candidate. |
| SC-005 (support ticket drop) | Compare ticket volume 30 days pre-/post-rollout. |
| SC-006 (no duplicate payments) | Audit backend payment table for duplicate `(user, amount, merchant, ts)` tuples within 2 minutes. |

## Rollback

The feature is additive on the client side. To disable without a backend change, short-circuit `paymentResultTracker.start()` to fall through to the existing result-screen flow (if any) and skip registering push tokens. Remove `expo-notifications` plugin entry from `app.json` only if also reverting the client.
