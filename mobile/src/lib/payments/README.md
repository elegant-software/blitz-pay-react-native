# payments/

Push + polling result tracker for TrueLayer payments.

Entry point: `paymentResultTracker.start(paymentRequestId)` — called from CheckoutScreen right after TrueLayer authorize returns.

Timing (see `constants.ts`):
- Initial wait before polling starts: **5s**
- Polling backoff: **2, 3, 5, 8, 13, 21 s**
- Max wait before timeout: **60s**

Guarantees:
- Exactly one terminal state transition per `paymentRequestId` — push+poll race is de-duped via a `resolved` flag inside the tracker (`paymentResultTracker.ts`).
- In-flight records persist to `expo-secure-store` so app-kill mid-payment is recovered on next launch via `recoverInFlight()`.
- On timeout, the persisted record is **kept** so a late push or next-launch recovery can still deliver the real outcome.

Subscribe to resolutions with `paymentResultTracker.subscribe(listener)` or via `usePaymentResult(paymentRequestId)` hook.

Backend contracts: see `specs/004-payment-result-notification/contracts/`.
