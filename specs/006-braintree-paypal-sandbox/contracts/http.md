# HTTP Contracts — Braintree PayPal

## POST /api/payments/braintree/client-token

Issues a short-lived Braintree client token for the Drop-in.

**Request body**: `{}` (none required — a future iteration may accept a `customerId`)

**Response 200**
```json
{ "clientToken": "eyJ2ZXJzaW9u..." }
```

**Response 500** — Braintree SDK error
```json
{ "error": "Braintree client token generation failed" }
```

---

## POST /api/payments/braintree/checkout

Submits a one-time PayPal nonce for settlement.

**Request body**
```json
{
  "nonce": "tokencc_bc_...",
  "amount": 24.50,
  "currency": "EUR",
  "invoiceId": "INV-123"         // optional — echoed for logging
}
```

**Response 200 (success)**
```json
{
  "status": "succeeded",
  "transactionId": "abc123xyz",
  "amount": "24.50",
  "currency": "EUR"
}
```

**Response 200 (declined)** — non-200 is reserved for infra errors; business failures are `status: failed`
```json
{
  "status": "failed",
  "message": "Processor declined",
  "code": "2000"
}
```

**Response 400**
```json
{ "error": "nonce and amount are required" }
```

---

## GET /braintree/drop-in.html

Serves the static Drop-in HTML page. The page:
- Fetches a client token from `/api/payments/braintree/client-token`.
- Initialises `braintree-web-drop-in` with `paypal: { flow: 'checkout' }`.
- On nonce received, calls `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'nonce', nonce }))`.
- On Drop-in error, posts `{ type: 'error', message }`.
- On cancel, posts `{ type: 'cancel' }`.

The mobile `WebView.onMessage` handler uses these message types to drive the `useBraintreePayPal` state machine.