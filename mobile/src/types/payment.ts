export interface PaymentMethod {
  id: string; // Stripe Payment Method ID (e.g., pm_...)
  brand: string; // Card brand (Visa, Mastercard, etc.)
  last4: string; // Last 4 digits of the card
  expiryMonth: number;
  expiryYear: number;
  isSaved?: boolean;
}

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'requires_action' | 'canceled';

export interface Transaction {
  id: string; // Internal transaction ID
  stripePaymentIntentId: string; // Stripe PaymentIntent ID (pi_...)
  amount: number; // Amount in cents
  currency: string; // ISO currency code (e.g., "eur")
  status: TransactionStatus;
  paymentMethodId?: string; // ID of the PaymentMethod used
  createdAt: string;
}
