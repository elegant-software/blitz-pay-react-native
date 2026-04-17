# Contract: useStripePayment Hook

## Purpose
Abstractions for handling the Stripe PaymentSheet flow in React Native screens.

## Interface

```typescript
interface UseStripePayment {
  // Initialize the payment sheet with data from the backend
  initializePayment: (params: InitializeParams) => Promise<void>;
  
  // Present the payment sheet to the user
  openPaymentSheet: () => Promise<PaymentResult>;
  
  // State indicators
  loading: boolean;
  error: string | null;
}

interface InitializeParams {
  paymentIntent: string;      // client_secret from Stripe
  ephemeralKey: string;      // for customer sessions
  customer: string;          // Stripe customer ID
  publishableKey: string;    // Stripe publishable key
}

type PaymentResult = 
  | { status: 'succeeded' }
  | { status: 'failed', error: string }
  | { status: 'canceled' };
```
