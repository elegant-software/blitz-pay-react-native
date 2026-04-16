# Implementation Plan: Payment Result Notification with Polling Fallback

**Branch**: `004-payment-result-notification` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-payment-result-notification/spec.md`

## Summary

After a payment is authorized (TrueLayer bank redirect), the mobile app must display the terminal result (succeeded / failed / cancelled) as quickly as possible. Primary channel: Expo push notification delivered by the backend the moment it finalizes the payment. Fallback channel: the app polls `GET /v1/payments/{paymentRequestId}` with backoff if no push arrives within ~5s, stopping at the first terminal status or at a 60s max wait. Both channels converge on a single de-duplicated state transition so push+poll races never double-render or double-track events.

## Technical Context

**Language/Version**: TypeScript 5.x, React Native 0.76 (Expo SDK 52)
**Primary Dependencies**: `expo-notifications` (push registration + listeners), `expo-secure-store` (persist in-flight payment ids), native `fetch` (status polling — matches existing auth code), React Navigation v6 (deep-link to result screen)
**Storage**: `expo-secure-store` for in-flight payment records (survives app kill); in-memory map for the active polling controller per `paymentRequestId`
**Testing**: Manual smoke tests on iOS Simulator + Android Emulator (no Jest suite currently configured in `/mobile` — matches existing project state per CLAUDE.md)
**Target Platform**: iOS 15+ and Android 10+ via Expo (primary: mobile app at `/mobile`). Web prototype at repo root is out of scope.
**Project Type**: Mobile app (existing Expo project under `/mobile`) + minimal backend integration surface (status endpoint + Expo push sender already owned by backend team)
**Performance Goals**: Terminal result visible within 5s via push for ≥95% of payments; within 60s for 100% of payments (push or poll)
**Constraints**: Polling must not exceed ~10 requests per payment within the 60s window (backoff 2s → 3s → 5s → 8s → 13s → 21s capped); must tolerate offline/transient network errors without showing "failed"; must not trigger duplicate payment submissions under any failure mode
**Scale/Scope**: Single concurrent payment is the common case, but design must correctly track N simultaneous in-flight payments keyed by `paymentRequestId`. Mobile user base on the order of hundreds of testers during prototype phase.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository constitution at `.specify/memory/constitution.md` is an unratified template (all placeholders, no concrete principles or version). There are therefore no project-specific gates to evaluate for this feature. General Spec Kit hygiene applies:

- Spec is outcome-focused (no tech in spec body — tech lives here in plan). ✅
- Feature is delivered as a scoped addition to the existing `/mobile` Expo app, no new top-level projects. ✅
- No speculative abstractions introduced (single notification service + single polling controller). ✅

No violations → Complexity Tracking table is empty and omitted.

**Post-Phase-1 re-check**: Design adds one service module (`paymentResultTracker`), one push registration hook, and one status-endpoint client function — all colocated with existing mobile lib code. Still no violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-payment-result-notification/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── payment-status-endpoint.md    # GET /v1/payments/{paymentRequestId}
│   └── push-notification-payload.md  # Expo push data shape
├── checklists/
│   └── requirements.md  # From /speckit.specify
└── tasks.md             # /speckit.tasks output (not yet created)
```

### Source Code (repository root)

```text
mobile/
├── src/
│   ├── lib/
│   │   ├── payments/
│   │   │   ├── paymentResultTracker.ts   # NEW — orchestrates push+poll, emits single terminal event
│   │   │   ├── paymentStatusClient.ts    # NEW — GET /v1/payments/{id} wrapper with retry/backoff
│   │   │   └── inFlightStore.ts          # NEW — expo-secure-store persistence of in-flight ids
│   │   ├── notifications/
│   │   │   ├── pushRegistration.ts       # NEW — request perms, get Expo token, register with backend
│   │   │   └── pushHandlers.ts           # NEW — foreground/background listeners + deep-link routing
│   │   ├── keycloak.ts                   # existing — source token for status endpoint
│   │   └── theme.ts                      # existing
│   ├── hooks/
│   │   └── usePaymentResult.ts           # NEW — subscribes a screen to a given paymentRequestId's terminal event
│   ├── screens/
│   │   ├── CheckoutScreen.tsx            # existing — will start the tracker on payment authorize
│   │   └── PaymentProcessingScreen.tsx   # NEW (or extend existing processing UI) — shows spinner → result via hook
│   └── navigation/
│       └── linking.ts                    # NEW or extended — deep-link config for push taps
└── app.json                              # add notifications plugin + iOS/Android entitlements
```

**Structure Decision**: Ship entirely inside the existing `/mobile` Expo project. Two new lib folders (`payments/` and `notifications/`) keep the push-vs-poll orchestration out of screen components. The existing checkout flow gets a single new call (`paymentResultTracker.start(paymentRequestId)`) at authorize time. Backend changes (sending Expo pushes on payment finalize) are owned by the backend team and tracked via the contract documents in `contracts/`, not built in this repo.

