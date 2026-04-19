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

---

# Tasks: Geofencing & Proximity Triggers

**Input**: Design documents from `/specs/006-braintree-paypal-sandbox/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/proximity-api.md, quickstart.md

---

## Phase 1: Setup

**Purpose**: Install dependencies and configure native build settings.

- [x] T023 Install `expo-location` and `expo-task-manager` in `mobile/` via `npx expo install expo-location expo-task-manager`
- [x] T024 Update `mobile/app.config.js`: add `expo-location` plugin, iOS `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes: ["location"]`; add Android `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` permissions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, static data, and server stub that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T025 [P] Define TypeScript interfaces `GeofenceRegion`, `ProximityEvent`, `GeofenceConfig`, `ProximityReportPayload`, `ProximityReportResponse` in `mobile/src/types/geofence.ts` (copy from data-model.md verbatim)
- [x] T026 [P] Create static merchant region definitions array `MERCHANT_REGIONS: GeofenceRegion[]` in `mobile/src/lib/geofenceRegions.ts` with at least 3 prototype merchants (lat/lng in Western Europe, radius 150m, `notifyOnEnter: true`, `enabled: true`)
- [x] T027 Implement `POST /api/proximity` stub in `mobile/server.ts`: validate required fields (`userId`, `merchantId`, `event`, `location`, `timestamp`), return `{ recorded: true, action: 'notify' }` for `enter` events and `{ recorded: true, action: 'none' }` for `exit`; return 400 on missing fields; log `[proximity] userId merchantId event` on each call

**Checkpoint**: Types defined, static regions available, server stub responding — user story implementation can begin.

---

## Phase 3: US1 — Background Geofence Monitoring (Priority: P1) 🎯 MVP

**Goal**: The device silently monitors registered merchant areas in the background. When the user enters a geofence, a proximity event is deduplicated and POSTed to `/api/proximity`.

**Independent Test**: Simulate a location fix inside a registered region (Xcode Debug → Simulate Location or Android emulator geo fix). Verify the background task fires, the cooldown entry is written to SecureStore, and `POST /api/proximity` is called exactly once. A second simulate within 10 minutes must NOT produce a second POST.

- [x] T028 Define `GEOFENCE_TASK = 'BLITZPAY_GEOFENCE_TASK'` and register the background task with `TaskManager.defineTask` in `mobile/src/tasks/geofenceTask.ts`; task handler reads `eventType` and `region` from data, ignores `Exit` events, calls `reportProximityIfNotCooledDown()` on `Enter`
- [x] T029 [US1] Implement `reportProximityIfNotCooledDown(region)` in `mobile/src/services/geofence.ts`: read `geofence_cooldown` JSON from `expo-secure-store`; skip POST if `regionId + 'enter'` was reported within 10 minutes; otherwise call `reportProximity()` and write updated cooldown entry
- [x] T030 [US1] Implement `reportProximity(payload: ProximityReportPayload)` in `mobile/src/services/geofence.ts`: fetch access token from SecureStore, POST to `${EXPO_PUBLIC_API_URL}/api/proximity` with Bearer auth; on 401 attempt one token refresh then retry; on 429 read `retryAfterSeconds` and log; return `ProximityReportResponse`
- [x] T031 [US1] Implement `startGeofencing()` in `mobile/src/services/geofence.ts`: request foreground permission, request background permission, compute 20 nearest enabled regions from `MERCHANT_REGIONS` using Haversine distance from last known coarse location (`Location.getLastKnownPositionAsync`), call `Location.startGeofencingAsync(GEOFENCE_TASK, regions)`
- [x] T032 [US1] Implement `stopGeofencing()` in `mobile/src/services/geofence.ts`: check `Location.hasStartedGeofencingAsync(GEOFENCE_TASK)` before calling `Location.stopGeofencingAsync(GEOFENCE_TASK)` to avoid errors when not running
- [x] T033 [US1] Import `mobile/src/tasks/geofenceTask.ts` at the top of `mobile/App.tsx` (or the Expo entry file) before any React component — required by `expo-task-manager` for task registration at global scope

**Checkpoint**: US1 fully functional — background task fires, deduplicates, and posts to proximity API.

---

## Phase 4: US2 — Proximity Notifications (Priority: P1)

**Goal**: When the proximity API responds `action: 'notify'`, a neutral local notification "You're at {merchantName}." appears — no payment UI is opened.

**Independent Test**: Trigger a geofence enter event for a known merchant. Verify a local notification appears with the text "You're at {merchantName}." Verify tapping the notification does NOT navigate to Checkout or any payment screen.

- [x] T034 [US2] In `mobile/src/tasks/geofenceTask.ts`, after `reportProximity()` resolves with `{ action: 'notify' }`, schedule a local notification via `expo-notifications` with title `"BlitzPay"` and body `"You're at {region.identifier}."` (no navigation payload)
- [x] T035 [P] [US2] Add geofence translation keys to `mobile/src/lib/translations.ts`: `geofence_notification_body` (`"You're at {merchant}."` EN / `"Du bist bei {merchant}."` DE), `geofence_permission_title`, `geofence_permission_body`, `geofence_enabled`, `geofence_disabled` (EN + DE)

**Checkpoint**: US1 + US2 complete — the feature is shippable at this point.

---

## Phase 5: US3 — User Controls & Permissions (Priority: P2)

**Goal**: The user can toggle geofencing on/off from the Account screen. Permission state is shown and the two-step foreground → background rationale is presented on first enable.

**Independent Test**: Open Account screen with geofencing off. Tap the toggle — foreground permission dialog appears, then background permission rationale. After granting both, the toggle shows "On" and `startGeofencing()` is called. Tapping toggle again calls `stopGeofencing()` and shows "Off".

- [x] T036 [US3] Implement `useGeofence()` hook in `mobile/src/hooks/useGeofence.ts`: exposes `{ isMonitoring, config, enable, disable, permissionStatus }`; calls `startGeofencing()` / `stopGeofencing()`; persists `GeofenceConfig` to SecureStore under key `geofence_config`; reads persisted config on mount and resumes monitoring if `geofencingEnabled: true`
- [x] T037 [US3] Add geofencing toggle section to `mobile/src/screens/AccountScreen.tsx`: import `useGeofence`, render a labelled toggle with current state (`geofence_enabled` / `geofence_disabled` translation keys), disable toggle if background permission permanently denied (show link-to-settings prompt instead)

**Checkpoint**: Users can self-manage the feature; settings survive app restarts.

---

## Phase 6: US4 — Polling Fallback (Priority: P3)

**Goal**: On Android devices where native geofencing is silently killed by the OS, a 60-second location polling task checks proximity against the registered regions and calls the same report logic.

**Independent Test**: Disable the geofence task (comment out `startGeofencingAsync`), enable polling fallback, place device (or simulator) inside a merchant region lat/lng, wait ≤ 60 seconds — verify `POST /api/proximity` is called.

- [x] T038 [US4] Define `GEOFENCE_POLL_TASK = 'BLITZPAY_GEOFENCE_POLL'` and register it with `TaskManager.defineTask` in `mobile/src/tasks/geofenceTask.ts`; handler calls `Location.getCurrentPositionAsync({ accuracy: Balanced })` then iterates `MERCHANT_REGIONS` computing Haversine distance; calls `reportProximityIfNotCooledDown()` for any region within radius
- [x] T039 [US4] Implement `startPolling()` in `mobile/src/services/geofence.ts`: call `Location.startLocationUpdatesAsync(GEOFENCE_POLL_TASK, { timeInterval: 60_000, distanceInterval: 50, accuracy: Location.Accuracy.Balanced })`
- [x] T040 [US4] In `startGeofencing()` (`mobile/src/services/geofence.ts`): after `startGeofencingAsync`, call `Location.hasStartedGeofencingAsync` and if it returns `false`, automatically call `startPolling()` as fallback; log `[geofence] falling back to polling`

**Checkpoint**: All four user stories complete.

---

## Phase 7: Polish

- [x] T041 [P] Run `npm run lint` (tsc) in `mobile/` and fix any type errors introduced by geofencing code
- [ ] T042 Rebuild the native app with `npx expo prebuild --clean` in `mobile/` to apply new permissions, then verify simulator smoke test per `specs/006-braintree-paypal-sandbox/quickstart.md` §6

---

## Dependencies & Execution Order (Geofencing)

1. **Phase 1 (T023–T024)**: Install deps + native config first — required before any device build.
2. **Phase 2 (T025–T027)**: Types, static data, and server stub must be complete before any user story.
3. **Phase 3 (T028–T033)**: US1 is the MVP — implement fully before US2.
4. **Phase 4 (T034–T035)**: US2 depends on US1 task handler being in place (T028).
5. **Phase 5 (T036–T037)**: US3 depends on `startGeofencing`/`stopGeofencing` (T031–T032).
6. **Phase 6 (T038–T040)**: US4 depends on `reportProximityIfNotCooledDown` (T029) and `startGeofencing` (T031).
7. **Polish (T041–T042)**: Runs last.

### Parallel Opportunities

```
T025 and T026 and T027 can run in parallel (different files, no deps)
T034 and T035 can run in parallel (different files)
T041 runs in parallel with T042
```

### Implementation Strategy

**MVP First (US1 + US2 only)**:
1. Complete Phase 1 & 2 → foundation ready
2. Complete Phase 3 (US1) → background monitoring works
3. Complete Phase 4 (US2) → notifications appear
4. **STOP and VALIDATE**: simulate geofence enter, verify notification appears, verify no payment UI opens
5. Ship MVP

**Incremental Delivery**:
- US3 adds user control — can follow MVP without breaking US1/US2
- US4 adds reliability on hostile Android OEMs — safe to defer