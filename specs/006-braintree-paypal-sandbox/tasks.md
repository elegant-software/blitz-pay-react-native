# Tasks: Braintree PayPal Sandbox

**Input**: Design documents from `/specs/006-braintree-paypal-sandbox/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http.md

## Phase 1: Setup

- [x] T001 Install deps in `mobile/`: `braintree` (server), `react-native-webview` (client)
- [x] T002 Add Braintree env keys to `mobile/.env` (do not commit real keys — placeholder + documented in quickstart)
- [x] T003 Extend `mobile/src/lib/config.ts` to expose `braintreeDropInUrl` from `EXPO_PUBLIC_BRAINTREE_DROPIN_URL`

## Phase 2: Foundational

- [x] T004 Define Braintree types in `mobile/src/types/braintree.ts` (`BraintreeClientToken`, `PayPalSaleResult`, `WebViewMessage`)
- [x] T005 Serve `mobile/public/braintree/drop-in.html` via `express.static` in `mobile/server.ts`
- [x] T006 Add Braintree gateway initialisation in `mobile/server.ts` guarded by env vars (missing keys → 503 with clear error)

## Phase 3: US1 — Pay with PayPal (P1) 🎯 MVP

- [x] T007 [US1] Implement `POST /api/payments/braintree/client-token` in `mobile/server.ts`
- [x] T008 [US1] Implement `POST /api/payments/braintree/checkout` in `mobile/server.ts` (transaction.sale, submitForSettlement)
- [x] T009 [US1] Author the Drop-in page `mobile/public/braintree/drop-in.html` (fetches token, renders PayPal-only Drop-in, posts nonce back)
- [x] T010 [US1] Implement `mobile/src/services/braintree.ts` — `fetchClientToken()`, `submitNonce()`
- [x] T011 [US1] Build `mobile/src/components/BraintreePayPalWebView.tsx` — modal with `react-native-webview`, `onMessage` bridge, dismiss button
- [x] T012 [US1] Implement `mobile/src/hooks/useBraintreePayPal.ts` — exposes `presentPayPal({ amount, currency })` returning `{ status, transactionId?, error? }`
- [x] T013 [US1] Wire into `mobile/src/screens/CheckoutScreen.tsx` — add `paypal` branch mirroring the `card` branch UX; show success modal / error box
- [x] T014 [US1] Update translations in `mobile/src/lib/translations.ts` — add `paypal_processing`, `paypal_cancelled`, `paypal_failed` keys (EN + DE)

## Phase 4: US2 — Cancellations & Failures (P1)

- [x] T015 [US2] Handle `type: 'cancel'` message → resolve `presentPayPal` with `{ status: 'cancelled' }`; Checkout exits processing quietly
- [x] T016 [US2] Handle declined transactions (`status: 'failed'` in response) → mapped error in Checkout error box
- [x] T017 [US2] Add timeout (30s) on `submitNonce` — surface as retriable error

## Phase 5: US3 — Observability (P2)

- [x] T018 [US3] Emit `checkout_confirm_started` / `_succeeded` / `_failed` with `method: 'paypal'` in Checkout (already the pattern for other methods)
- [x] T019 [US3] Log transaction id (not nonce, not payer email) on the server side

## Phase 6: Polish

- [x] T020 [P] Run `npm run lint` (tsc) in `mobile/` and fix type issues
- [x] T021 [P] Manual smoke with `fake-valid-nonce` against `/api/payments/braintree/checkout` to verify sale path without Drop-in
- [x] T022 [P] Add README note under `mobile/README.md` (or create if missing) pointing at `specs/006-braintree-paypal-sandbox/quickstart.md`

## Dependencies & Execution Order

1. Phase 1 & 2 are strictly required before any User Story.
2. US1 is the MVP. US2 completes the error paths needed before shipping.
3. US3 is low-risk and runs alongside US1/US2.
4. Polish (Phase 6) runs last.