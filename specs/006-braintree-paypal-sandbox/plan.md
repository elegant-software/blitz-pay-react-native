# Implementation Plan: Braintree PayPal Sandbox

**Branch**: `006-braintree-paypal-sandbox` | **Date**: 2026-04-17 | **Spec**: [specs/006-braintree-paypal-sandbox/spec.md](spec.md)
**Input**: Feature specification from `/specs/006-braintree-paypal-sandbox/spec.md`

## Summary

Wire up the PayPal option on the Checkout screen using Braintree's sandbox. The Express server issues client tokens and submits transactions via the `braintree` Node SDK. The mobile app loads Braintree `braintree-web-drop-in` (PayPal mode) inside a `react-native-webview` hosted from the same Express server, receives a payment nonce via `postMessage`, and posts it back to the server for `transaction.sale`.

## Technical Context

**Language/Version**: TypeScript / React Native 0.83.4 (Expo SDK 55) / Node 20
**Primary Dependencies**:
- Server: `braintree` (Node SDK v3)
- Mobile: `react-native-webview`, existing `expo`, React Navigation v6
- Drop-in UI (served HTML): `braintree-web-drop-in@1.x` loaded from CDN in the static page
**Storage**: None — nonces are one-time and transaction ids live server-side only.
**Testing**: Manual via sandbox buyer. `npm run lint` (tsc --noEmit) for type safety.
**Target Platform**: iOS, Android (via Expo prebuild). Web prototype untouched.
**Project Type**: mobile-app (single `/mobile` project with an Express sidecar)
**Performance Goals**: Drop-in page ready < 2s on warm CDN; end-to-end sandbox payment < 60s.
**Constraints**:
- Sandbox only. Do not ship production Braintree keys.
- No raw PayPal credentials leave the Drop-in iframe; the app only handles nonces and transaction ids.
- Match the existing Stripe flow's UX on Checkout (same success modal, same error box).
**Scale/Scope**: One new payment option, one WebView screen/modal, two new server endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Library-First: Braintree logic is isolated in `mobile/src/services/braintree.ts`, `mobile/src/hooks/useBraintreePayPal.ts`, and the server in a dedicated route module.
- [x] Test-First: Not introducing a new test framework; matches the rest of `/mobile` which is manual + typecheck.
- [x] Simplicity: Reuses Braintree's hosted Drop-in UI instead of a native SDK module. One WebView, no native Android/iOS code.

## Project Structure

### Documentation (this feature)

```text
specs/006-braintree-paypal-sandbox/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (HTTP contracts)
└── tasks.md             # Phase 2 output
```

### Source Code

```text
mobile/
├── server.ts                          # Adds Braintree gateway + routes + static Drop-in page
├── public/
│   └── braintree/drop-in.html         # Hosted Drop-in UI (PayPal)
├── src/
│   ├── services/
│   │   └── braintree.ts               # Thin client: fetch token, submit nonce
│   ├── hooks/
│   │   └── useBraintreePayPal.ts      # Orchestrates: token → WebView → nonce → sale
│   ├── components/
│   │   └── BraintreePayPalWebView.tsx # Modal WebView hosting the Drop-in page
│   ├── types/
│   │   └── braintree.ts               # BraintreeClientToken, PayPalNonce, BraintreeSaleResult
│   └── screens/
│       └── CheckoutScreen.tsx         # Adds `paypal` branch alongside `bank` and `card`
```

**Structure Decision**: Matches the Stripe integration pattern (service + hook + screen wiring) and the existing Express sidecar pattern. No new top-level directories.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Hosted HTML page served by Express | Braintree's JS Drop-in expects a DOM to render into; RN has no DOM | Native Braintree Drop-in SDKs exist but would require EAS build + native module installs, far beyond a prototype's needs |
| `react-native-webview` dependency | Required to render the Drop-in page and bridge nonces back via `postMessage` | Expo's `WebBrowser` opens an external browser — breaks the `postMessage` bridge and deep-link would need extra plumbing |