# Data Model: Stripe Card Payments

## Entities

### PaymentMethod
Represents a card stored or used for a single transaction.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | string | Stripe Payment Method ID (e.g., pm_...) | Required |
| brand | string | Card brand (Visa, Mastercard, etc.) | Required |
| last4 | string | Last 4 digits of the card | 4 digits |
| expiryMonth | number | Expiration month | 1-12 |
| expiryYear | number | Expiration year | Current year or future |
| isSaved | boolean | Whether the user opted to save the card | Default: false |

### Transaction
Represents a payment attempt.

| Field | Type | Description | Relationships |
|-------|------|-------------|---------------|
| id | string | Internal transaction ID | Linked to Order |
| stripePaymentIntentId | string | Stripe PaymentIntent ID (pi_...) | Required |
| amount | number | Amount in cents | Required, > 0 |
| currency | string | ISO currency code (e.g., "eur") | Required |
| status | enum | Status of the payment | [pending, succeeded, failed, requires_action] |
| paymentMethodId | string | ID of the PaymentMethod used | Linked to PaymentMethod |

## State Transitions (Transaction Status)
1.  **pending**: PaymentIntent created on backend.
2.  **requires_action**: User needs to complete 3D Secure authentication.
3.  **succeeded**: Payment successfully captured.
4.  **failed**: Payment declined or error occurred.
