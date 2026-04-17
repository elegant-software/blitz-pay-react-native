# Tasks: Stripe Card Payments

**Input**: Design documents from `/specs/005-stripe-card-payments/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 [P] Install dependencies: `@stripe/stripe-react-native`, `expo-camera` in `mobile/package.json`
- [x] T002 Update `mobile/app.json` with Stripe plugin, `merchantIdentifier`, `enableGooglePay`, and `NSCameraUsageDescription`
- [x] T003 [P] Configure `urlScheme` in `mobile/app.json` for deep linking support

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Define `Transaction` and `PaymentMethod` types in `mobile/src/types/payment.ts`
- [x] T005 [P] Implement Stripe initialization helper in `mobile/src/services/stripe.ts`
- [x] T006 Initialize `StripeProvider` in `mobile/App.tsx` using `urlScheme` from config
- [x] T007 [P] Create mock backend response handler for `POST /api/payments/create-intent` in `mobile/src/lib/api-mocks.ts` (if needed for testing)

---

## Phase 3: User Story 1 - Secure Card Checkout (Priority: P1) 🎯 MVP

**Goal**: Enable users to pay via card using Stripe PaymentSheet.

**Independent Test**: Select "Pay by Card" on Checkout screen, enter test card 4242...42, and confirm success.

- [x] T008 [US1] Create `useStripePayment` hook in `mobile/src/hooks/useStripePayment.ts` to manage PaymentSheet lifecycle
- [x] T009 [US1] Implement `initializePaymentSheet` logic in `useStripePayment.ts` using client secret from backend
- [x] T010 [US1] Implement `presentPaymentSheet` logic in `useStripePayment.ts`
- [x] T011 [US1] Integrate "Pay by Card" button and flow into `mobile/src/screens/CheckoutScreen.tsx`
- [x] T012 [US1] Add basic success/error handling for the payment flow in `CheckoutScreen.tsx`

---

## Phase 4: User Story 3 - Payment Status Feedback & 3DS (Priority: P1)

**Goal**: Provide immediate feedback and handle 3D Secure authentication.

**Independent Test**: Use 3DS test card `4000 0027 6000 3184` and verify the authentication modal appears and completes.

- [x] T013 [US3] Implement detailed error mapping for Stripe errors in `mobile/src/services/stripe.ts`
- [x] T014 [US3] Update `CheckoutScreen.tsx` to redirect to `PaymentResultScreen` with Stripe-specific status
- [x] T015 [US3] Verify 3D Secure redirect flow works with the configured `urlScheme`

---

## Phase 5: User Story 2 - Save Card for Future Use (Priority: P2)

**Goal**: Allow users to securely save card details for future payments.

**Independent Test**: Complete payment with "Save card" checked, verify next checkout shows saved card option.

- [x] T016 [US2] Update `useStripePayment.ts` to support `allowsDelayedPaymentMethods` and `setup_future_usage`
- [x] T017 [US2] Update backend intent creation mock to support customer session and ephemeral keys
- [x] T018 [US2] Verify saved card selection in `PaymentSheet` UI

---

## Phase 6: User Story 4 - Card Scanning Support (Priority: P1)

**Goal**: Allow users to scan physical cards via camera.

**Independent Test**: Open PaymentSheet and verify the "Scan Card" option is visible and functional on iOS/Android.

- [x] T019 [US4] Explicitly enable `preferredNetworks` and verify card scanning flags in `initPaymentSheet`
- [x] T020 [US4] Verify camera permission prompt appears correctly on first scan attempt

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T021 [P] Update `mobile/README.md` with Stripe integration notes and testing instructions
- [x] T022 Code cleanup: Remove any debugging logs and ensure proper TypeScript types throughout
- [x] T023 Run `quickstart.md` validation on a real device/emulator

---

## Dependencies & Execution Order

1. **Phase 1 & 2** are strictly required before any User Story.
2. **User Story 1 (P1)** is the primary focus for MVP.
3. **User Story 3 (P1)** should be implemented alongside or immediately after US1 for a complete checkout experience.
4. **User Story 4 (P1)** is a high-priority UX improvement that can be tested once the basic PaymentSheet is working.
5. **User Story 2 (P2)** can be implemented last as it requires more backend coordination (Customer/Ephemeral keys).
