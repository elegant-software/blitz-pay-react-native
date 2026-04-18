# Feature Specification: Braintree PayPal Sandbox

**Feature Branch**: `006-braintree-paypal-sandbox`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "integration with BrainTree Paypal sandbox to cover paypal payments"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pay with PayPal via Braintree (Priority: P1)

As a customer on the Checkout screen, I want to pay with my PayPal account so that I can complete a purchase without entering card details.

**Why this priority**: Core capability of the feature. Mirrors the Stripe card flow (005) for the PayPal payment method option already present in the UI but not yet wired up.

**Independent Test**: Select "PayPal" on the Checkout screen, complete the Braintree sandbox PayPal flow with sandbox buyer credentials, and verify the transaction is created and the success modal appears.

**Acceptance Scenarios**:

1. **Given** the user is on the Checkout screen, **When** they select "PayPal" and tap Confirm, **Then** Braintree's PayPal Drop-in flow is presented in a secure WebView.
2. **Given** the user authorizes the payment with sandbox PayPal credentials, **When** the Drop-in returns a payment nonce, **Then** the backend submits a Braintree `transaction.sale` and returns a succeeded transaction.
3. **Given** the backend confirms success, **When** the Checkout screen receives the result, **Then** the user is shown the success modal with BlitzPoints earned (same UX as card flow).

---

### User Story 2 - Handle Cancellations and Failures (Priority: P1)

As a user, I want clear feedback when a PayPal payment is cancelled or declined so that I know the transaction did not complete.

**Why this priority**: Users must understand payment outcomes to retry or switch methods.

**Independent Test**: Start a PayPal payment and close the Drop-in without authorizing. Verify the Checkout screen shows a cancellation state and allows retry.

**Acceptance Scenarios**:

1. **Given** the PayPal Drop-in is open, **When** the user closes it without completing, **Then** the Checkout screen exits the processing state and no transaction is created.
2. **Given** Braintree returns a declined transaction (e.g., using the `2000` decline amount), **When** the backend responds, **Then** a localized error message is shown and the user can retry.
3. **Given** the network fails while submitting the nonce, **When** the request times out, **Then** the user sees a retriable error (not a success).

---

### User Story 3 - Observability & Audit (Priority: P2)

As an engineering stakeholder, I want PayPal payment attempts to emit the same observability events as the other payment methods so that I can diagnose issues in the same dashboards.

**Why this priority**: Keeps the feature at parity with existing flows without blocking MVP.

**Independent Test**: Trigger a successful and a failed PayPal payment, then verify `checkout_confirm_started`, `checkout_confirm_succeeded`, and `checkout_confirm_failed` events include `method: 'paypal'` in observability logs.

### Edge Cases

- **WebView closed mid-flow**: Treated as cancellation; no backend transaction is submitted.
- **Nonce reuse**: A nonce returned by Drop-in is consumed exactly once per `transaction.sale`.
- **Server offline**: The client token fetch fails; the user sees a localized error without opening the Drop-in.
- **Sandbox merchant mismatch**: The client token's merchant ID must match the backend Braintree credentials; mismatches surface as a client-side init error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to select "PayPal" on the Checkout screen and initiate a Braintree PayPal flow.
- **FR-002**: Backend MUST issue a short-lived client token via Braintree SDK (`gateway.clientToken.generate`).
- **FR-003**: Mobile MUST render Braintree's PayPal Drop-in UI in a secure WebView and receive a payment-method nonce.
- **FR-004**: Backend MUST create a `transaction.sale` with `submitForSettlement: true`, `paymentMethodNonce`, `amount`, and return the transaction status + id.
- **FR-005**: System MUST treat user dismissal of the Drop-in as a cancellation (no transaction submitted, no error shown).
- **FR-006**: System MUST show localized error messages for declined/failed transactions.
- **FR-007**: System MUST NOT store raw PayPal credentials or nonces in device storage.
- **FR-008**: System MUST emit observability events on start/success/failure (method=`paypal`).
- **FR-009**: System MUST operate against Braintree **sandbox** credentials only in this feature.

### Key Entities

- **BraintreeClientToken**: Short-lived token scoped to a merchant, used by the client to initialize Drop-in.
- **PaymentNonce**: One-time-use token returned by Drop-in representing an authorized PayPal account.
- **BraintreeTransaction**: Server-side record created via `transaction.sale` — fields: id, status (`submitted_for_settlement`, `settling`, `settled`, `failed`, `voided`), amount, currency, paypalAccount (email, payerId).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a PayPal sandbox payment in under 60 seconds from tapping Confirm.
- **SC-002**: 100% of successful Drop-in nonces that reach the backend result in a recorded Braintree transaction id in logs.
- **SC-003**: Cancellation from the Drop-in does not produce an error toast or a backend call.
- **SC-004**: No sensitive payer data (email, payerId) is written to SecureStore or Observability payloads.

## Assumptions

- **Braintree Sandbox**: A sandbox merchant account is available; `BRAINTREE_MERCHANT_ID`, `BRAINTREE_PUBLIC_KEY`, `BRAINTREE_PRIVATE_KEY` are provided via `mobile/.env`.
- **PayPal Sandbox linked**: The Braintree sandbox control panel has a linked PayPal sandbox business account (standard for new sandboxes).
- **Scope**: Mobile React Native app only. The web prototype under `/` is untouched.
- **Currency**: EUR, same as Stripe flow. (The sandbox merchant must allow EUR; otherwise the backend falls back to USD.)
- **UI hosting**: The Drop-in page is served by the existing Express server (`mobile/server.ts`) at `/braintree/drop-in.html`, loaded in a `react-native-webview`. This avoids adding native modules.
- **No saved PayPal**: Saving a PayPal account as a vaulted payment method is out of scope for this iteration.