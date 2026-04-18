# Data Model: Braintree PayPal Sandbox

## Entities

### BraintreeClientToken
Short-lived token used by the client Drop-in to authenticate with Braintree's gateway.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| clientToken | string | Opaque token from `gateway.clientToken.generate` | Required |
| expiresAt | string (ISO) | Server-side timestamp when the token was issued + ~24h | Optional |

### PayPalNonce
One-time-use token returned by Drop-in representing an authorized PayPal account.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| nonce | string | e.g., `tokencc_...` or `fake-valid-nonce` | Required, single use |
| type | string | Always `"PayPalAccount"` for this flow | Required |
| details.email | string | Payer email (from sandbox buyer) | Not persisted; passed through |

### BraintreeTransaction
Result of `gateway.transaction.sale`.

| Field | Type | Description | Relationships |
|-------|------|-------------|---------------|
| id | string | Braintree transaction id | Primary key (server-side logs) |
| amount | string | Amount formatted with 2 decimals (Braintree requirement) | Required |
| currency | string | ISO 4217, e.g., "EUR" | Required |
| status | enum | See State Transitions | — |
| paymentMethod | string | `"paypal_account"` | Required for this feature |
| paypalAccount.payerEmail | string | Sandbox buyer email | Echoed back to client, not stored |

## State Transitions (BraintreeTransaction.status)
1. **submitted_for_settlement**: Sale accepted (terminal-success for our flow).
2. **settling / settled**: Post-settlement states reported by Braintree sandbox.
3. **gateway_rejected / processor_declined / failed**: Terminal-failure — surface localized message.
4. **voided**: Not produced by this flow but represented for completeness.

## Request/Response Shapes (server boundary)

### POST /api/payments/braintree/client-token → 200
```json
{ "clientToken": "eyJ2ZXJzaW9u..." }
```

### POST /api/payments/braintree/checkout → 200
Request:
```json
{ "nonce": "tokencc_...", "amount": 24.5, "currency": "EUR" }
```
Response (success):
```json
{
  "status": "succeeded",
  "transactionId": "abc123",
  "amount": "24.50",
  "currency": "EUR"
}
```
Response (failure):
```json
{ "status": "failed", "message": "Processor declined: 2000" }
```