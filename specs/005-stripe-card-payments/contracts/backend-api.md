# Contract: Backend Payment API

## Endpoint: POST /api/payments/create-intent

### Request
```json
{
  "amount": 1000,
  "currency": "eur",
  "order_id": "ord_123",
  "save_card": true
}
```

### Response (Success)
```json
{
  "paymentIntent": "pi_..._secret_...",
  "ephemeralKey": "ek_...",
  "customer": "cus_...",
  "publishableKey": "pk_..."
}
```
