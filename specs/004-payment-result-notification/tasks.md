---

description: "Task list for feature 004-payment-result-notification"
---

# Tasks: Payment Result Notification with Polling Fallback

**Input**: Design documents from `/specs/004-payment-result-notification/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated test suite is configured for `/mobile` (per `CLAUDE.md` → "No test suite is configured"). Test tasks are therefore omitted; validation is done via the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story (US1 = push happy path P1, US2 = polling fallback P1, US3 = max-wait graceful state P2) so each story can be implemented, validated via `quickstart.md`, and shipped independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are absolute repo paths rooted at `/Users/mehdi/MyProject/blitz-pay-prototype/`

## Path Conventions

All implementation paths are under `mobile/` (Expo app). Spec artifacts are under `specs/004-payment-result-notification/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install push/notification dependencies, configure Expo plugins, wire env vars.

- [X] T001 Install `expo-notifications` and `expo-device` in `mobile/` (run `cd mobile && npx expo install expo-notifications expo-device`) and commit the resulting changes to `mobile/package.json` and `mobile/package-lock.json`
- [X] T002 Add the `expo-notifications` plugin block to `mobile/app.json` under `expo.plugins` with `{ "sounds": [] }`; add iOS `infoPlist.UIBackgroundModes: ["remote-notification"]` and Android `permissions: ["RECEIVE_BOOT_COMPLETED","VIBRATE"]`
- [X] T003 [P] Add `EXPO_PUBLIC_API_BASE_URL` to `mobile/.env.example` with a commented placeholder and document it in `CLAUDE.md` under "Mobile App" env vars
- [X] T004 [P] Create the new folders `mobile/src/lib/payments/` and `mobile/src/lib/notifications/` with empty `index.ts` barrel files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared primitives every story relies on — types, constants, auth-aware fetch helper, deep-link config.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create shared payment types in `mobile/src/lib/payments/types.ts` exporting `PaymentStatus`, `TerminalPaymentStatus`, `PaymentResult`, `PaymentResultPushData` per `specs/004-payment-result-notification/data-model.md`
- [X] T006 Create timing constants in `mobile/src/lib/payments/constants.ts`: `INITIAL_WAIT_MS = 5000`, `MAX_WAIT_MS = 60000`, `BACKOFF_SCHEDULE_MS = [2000, 3000, 5000, 8000, 13000, 21000]`
- [X] T007 [P] Add an authenticated fetch helper `authedFetch(path, init)` in `mobile/src/lib/api/authedFetch.ts` that reads the access token from the existing Keycloak session in `mobile/src/lib/keycloak.ts`, attaches `Authorization: Bearer`, refreshes on a single 401, and returns the raw `Response`
- [X] T008 [P] Add React Navigation `linking` config in `mobile/src/navigation/linking.ts` mapping `blitzpay://payments/:paymentRequestId/result` → the `PaymentResult` screen and export a typed `NavigationLinking` object; wire it into the existing `NavigationContainer` in `mobile/App.tsx` (or wherever the container currently lives)
- [X] T009 Add an analytics event helper `trackPaymentResultEvent(name, props)` in `mobile/src/lib/payments/analytics.ts` with the event names from `research.md` §11 (`payment_result_push_received`, `payment_result_poll_terminal`, `payment_result_timeout`, `payment_result_duplicate_suppressed`); a `console.info`-backed stub is fine for the prototype

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Near-instant payment result via push notification (Priority: P1) 🎯 MVP

**Goal**: User sees the terminal result within ~5s of backend finalization via an Expo push notification; tapping the notification deep-links to the result screen.

**Independent Test**: Quickstart "Happy path — push delivery" section — grant notifications, authorize a payment, finalize on backend, confirm UI transitions within 5s.

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement `pushRegistration.ts` in `mobile/src/lib/notifications/pushRegistration.ts`: request notification permission, fetch Expo push token via `Notifications.getExpoPushTokenAsync`, cache it in `expo-secure-store` under `blitzpay_push_token`, and POST to `/v1/devices/push-token` via `authedFetch` per `specs/004-payment-result-notification/contracts/push-registration-endpoint.md`; no-op if the cached token matches. Export `registerForPushAsync()` and `handlePermissionChange()`
- [X] T011 [P] [US1] Create the Android `payments` notification channel at bootstrap with `IMPORTANCE_HIGH` in `mobile/src/lib/notifications/channels.ts`; exported `ensurePaymentsChannel()` called once from app root
- [X] T012 [US1] Implement `paymentResultTracker.ts` in `mobile/src/lib/payments/paymentResultTracker.ts` with an in-memory `Map<paymentRequestId, TrackerState>`; expose `start(paymentRequestId): Promise<PaymentResult>`, `applyPush(data)`, `applyPollResult(result)`, `cancel(paymentRequestId)`. Resolution is single-shot (guards by `resolved` flag), fires exactly one analytics event, and emits via an `EventEmitter` so hooks can subscribe (dep: T005, T006, T009)
- [X] T013 [US1] Implement `pushHandlers.ts` in `mobile/src/lib/notifications/pushHandlers.ts`: register foreground `addNotificationReceivedListener`, background `addNotificationResponseReceivedListener`, and cold-start `getLastNotificationResponseAsync`. On `data.type === "payment_result"`, call `paymentResultTracker.applyPush(data)` and navigate via the `linking` URL. Export `initPushHandlers(navigationRef)` (dep: T008, T012)
- [X] T014 [US1] Create the `usePaymentResult(paymentRequestId)` hook in `mobile/src/hooks/usePaymentResult.ts` that subscribes to the tracker's event emitter and returns `{ status: 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'timeout', result?: PaymentResult }` (dep: T012)
- [X] T015 [US1] Create `PaymentProcessingScreen.tsx` in `mobile/src/screens/PaymentProcessingScreen.tsx` that calls `usePaymentResult(paymentRequestId)` from route params, shows the existing spinner while `status === 'processing'`, and navigates to the result screen (success/failure/cancelled variants) when a terminal status is received (dep: T014)
- [X] T016 [US1] Update the checkout flow in `mobile/src/screens/CheckoutScreen.tsx` to call `paymentResultTracker.start(paymentRequestId)` immediately after the TrueLayer authorize returns a `paymentRequestId`, then navigate to `PaymentProcessingScreen` with the id as a route param (dep: T012, T015)
- [X] T017 [US1] Wire bootstrap calls in `mobile/App.tsx` (or the existing root component) to: (a) call `ensurePaymentsChannel()` once, (b) call `initPushHandlers(navigationRef)` after NavigationContainer mounts, (c) call `registerForPushAsync()` inside the existing Keycloak auth-success callback (dep: T010, T011, T013)

**Checkpoint**: User Story 1 fully functional — push happy path end-to-end. Verify against `quickstart.md` "Happy path — push delivery".

---

## Phase 4: User Story 2 — Polling fallback when push does not arrive (Priority: P1)

**Goal**: If no push arrives within 5s, the app polls `GET /v1/payments/{paymentRequestId}` on a backoff schedule and converges to the terminal result without duplicating the push signal.

**Independent Test**: Quickstart "Fallback path — polling" section — revoke notification permission, authorize a payment, finalize on backend, confirm the app independently reaches the result via polling.

### Implementation for User Story 2

- [X] T018 [P] [US2] Implement `paymentStatusClient.ts` in `mobile/src/lib/payments/paymentStatusClient.ts` exporting `fetchPaymentStatus(paymentRequestId): Promise<PaymentResult | { status: 'non_terminal' } | { status: 'not_found' }>` per `specs/004-payment-result-notification/contracts/payment-status-endpoint.md`. Handles 200 terminal/non-terminal split, 404, 401-refresh-retry-once, 429 `Retry-After`, and transient 5xx/network → returns `non_terminal` (dep: T005, T007)
- [X] T019 [P] [US2] Implement `inFlightStore.ts` in `mobile/src/lib/payments/inFlightStore.ts` backed by `expo-secure-store` key `blitzpay_inflight_payments`: exports `add(record)`, `remove(id)`, `list()`, `update(id, patch)`; enforces uniqueness by `paymentRequestId`; drops records older than `MAX_WAIT_MS * 2` during `list()` (dep: T005, T006)
- [X] T020 [US2] Extend `paymentResultTracker.start()` in `mobile/src/lib/payments/paymentResultTracker.ts` to: (a) persist via `inFlightStore.add`, (b) schedule the first poll at `INITIAL_WAIT_MS`, (c) iterate through `BACKOFF_SCHEDULE_MS` until terminal or `MAX_WAIT_MS` elapsed, (d) call `applyPollResult` on terminal, (e) remove from `inFlightStore` on resolution. Guard so an `applyPush` resolution aborts the in-flight poll via `AbortController` and cancels the next-scheduled timer (dep: T012, T018, T019)
- [X] T021 [US2] Add app-launch recovery in `mobile/src/lib/payments/recoverInFlight.ts`: on cold start, `inFlightStore.list()` → for each id call `fetchPaymentStatus(id)` once; if terminal, emit via tracker (with a "recovered" source tag) and remove from store; if non-terminal and still within `MAX_WAIT_MS * 2` of `startedAt`, re-arm the tracker with the remaining time budget; otherwise drop (dep: T018, T019, T020)
- [X] T022 [US2] Wire `recoverInFlight()` into `mobile/App.tsx` bootstrap, to run once after auth initialization completes, before the user lands on the home screen (dep: T021)
- [X] T023 [US2] Verify and tighten de-duplication in `paymentResultTracker.applyPush` / `applyPollResult` — both call a private `resolveOnce(source, result)`; second caller increments `payment_result_duplicate_suppressed` analytics and returns without side effects (dep: T012, T020)

**Checkpoint**: User Stories 1 AND 2 both work independently. Push-only, poll-only, and push+poll-race scenarios all produce exactly one UI transition per payment. Verify against `quickstart.md` "Fallback path" and "Dedup verification".

---

## Phase 5: User Story 3 — Graceful handling when no result arrives within max wait (Priority: P2)

**Goal**: If neither push nor polling yields a terminal status within 60s, the app exits the spinner to a "still processing — we'll notify you" state instead of a false success/failure.

**Independent Test**: Quickstart "Max-wait path" section — authorize a payment but never finalize on backend, confirm app transitions to pending state at T+60s and later reflects the final status when it arrives.

### Implementation for User Story 3

- [X] T024 [US3] Add a `timeout` terminal path inside `paymentResultTracker.ts`: when `Date.now() - startedAt >= MAX_WAIT_MS` with no terminal signal, resolve the promise with `{ status: 'timeout' }` and emit a `payment_result_timeout` analytics event (dep: T020)
- [X] T025 [P] [US3] Create `PaymentPendingScreen.tsx` in `mobile/src/screens/PaymentPendingScreen.tsx` showing the "still processing — we'll notify you" copy with DE/EN translations added to `mobile/src/lib/translations.ts` (keys `paymentResult.pending.title`, `paymentResult.pending.body`, `paymentResult.pending.invoicesCta`) and a CTA button that navigates to the existing Invoices screen
- [X] T026 [US3] Extend `PaymentProcessingScreen.tsx` to route to `PaymentPendingScreen` when the hook returns `status === 'timeout'` (dep: T014, T015, T024, T025)
- [X] T027 [US3] Ensure the in-flight record is NOT removed on `timeout` — only marked `resolved: false` and `lastPolledAt` updated — so a later push or recovery-on-launch can still deliver the real terminal result; update `inFlightStore` accordingly in `recoverInFlight.ts` and `paymentResultTracker.ts` (dep: T019, T020, T021, T024)
- [X] T028 [US3] When a push arrives for a payment the user has left on the pending screen, the tracker still emits; add a listener in `mobile/src/lib/notifications/pushHandlers.ts` that shows a local toast/banner "Payment <merchant> completed" via the existing notification UI if the user is no longer on the related screen (dep: T013, T024)

**Checkpoint**: All three user stories independently functional. The feature meets SC-002 (100% of payments reach a terminal UI state within 60s) and SC-003 (zero indefinite spinners).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T029 [P] Add structured log lines with `paymentRequestId` to every analytics event call in `mobile/src/lib/payments/paymentResultTracker.ts` so production traces can reconstruct push-vs-poll winner
- [X] T030 [P] Update `CLAUDE.md` "Mobile App" section to document the new `payments/` and `notifications/` lib folders and the `paymentResultTracker.start()` entry point
- [X] T031 [P] Add a concise README in `mobile/src/lib/payments/README.md` (≤30 lines) summarizing the tracker's contract, timing constants, and de-dup guarantee
- [X] T032 Run every scenario in `specs/004-payment-result-notification/quickstart.md` on a physical iOS device and an Android Emulator (or device) and record pass/fail in the PR description
- [X] T033 Verify no regressions in the existing checkout → result flow when `EXPO_PUBLIC_AUTH_BYPASS=true` (bypass mode should short-circuit tracker start and route directly to a stubbed success screen)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; BLOCKS all user stories.
- **User Story 1 (Phase 3)**: depends on Foundational. MVP.
- **User Story 2 (Phase 4)**: depends on Foundational. Shares the `paymentResultTracker` file with US1 (T020 extends T012) — so in parallel development, US2's T020/T023 must merge *after* US1's T012.
- **User Story 3 (Phase 5)**: depends on Foundational + a minimal tracker (ideally US1+US2 merged first because T024/T027 extend the tracker's state machine).
- **Polish (Phase 6)**: depends on all desired user stories merged.

### Within Each User Story

- Models/types (in Foundational) before services.
- Services (`paymentStatusClient`, `inFlightStore`, `paymentResultTracker`) before hooks.
- Hooks before screens.
- Bootstrap wiring (`App.tsx`) after all the pieces it imports exist.

### Parallel Opportunities

- Setup T003 + T004 can run in parallel.
- Foundational T007 + T008 can run in parallel after T005/T006.
- US1 T010 + T011 in parallel.
- US2 T018 + T019 in parallel (independent files); both must finish before T020.
- Polish T029 + T030 + T031 all in parallel.

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch in parallel:
Task: "Implement pushRegistration.ts in mobile/src/lib/notifications/pushRegistration.ts"   # T010
Task: "Create Android payments channel in mobile/src/lib/notifications/channels.ts"         # T011

# Then sequentially (all share paymentResultTracker.ts or consume it):
Task: "Implement paymentResultTracker.ts in mobile/src/lib/payments/paymentResultTracker.ts"  # T012
Task: "Implement pushHandlers.ts in mobile/src/lib/notifications/pushHandlers.ts"             # T013
Task: "Create usePaymentResult hook in mobile/src/hooks/usePaymentResult.ts"                  # T014
```

## Parallel Example: User Story 2

```bash
# Independent files — run together:
Task: "Implement paymentStatusClient.ts in mobile/src/lib/payments/paymentStatusClient.ts"    # T018
Task: "Implement inFlightStore.ts in mobile/src/lib/payments/inFlightStore.ts"                # T019
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1) — push-only happy path.
3. Validate against `quickstart.md` "Happy path — push delivery".
4. Ship/demo.

### Incremental Delivery

1. Phase 1 + 2 → foundation ready.
2. Add US1 (push) → demo MVP.
3. Add US2 (polling + restart recovery + dedup) → demo; now resilient to push loss.
4. Add US3 (timeout + pending screen) → demo; now resilient to backend outage.
5. Polish phase → production-ready.

### Parallel Team Strategy

Two developers:

1. Together complete Phase 1 + Phase 2.
2. Developer A: US1 (push channel).
3. Developer B: US2 foundation (T018 `paymentStatusClient`, T019 `inFlightStore`) — can build these against mock tracker events while waiting for A's T012 to merge; then integrate T020/T021/T022/T023.
4. Either developer: US3 after US1+US2 merged.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Tests are intentionally omitted — no test harness exists in `/mobile`; `quickstart.md` is the validation plan.
- Every task lists an absolute file path so an LLM executor can open the correct file without search.
- Commit after each task or small logical group (e.g., T005+T006 together, T018+T019 together).
- Stop at any checkpoint to validate a story independently.
- Avoid: adding code to `paymentResultTracker.ts` from multiple stories in parallel without serializing merges — it's the one cross-story shared file.
