export interface BraintreeClientTokenResponse {
  clientToken: string;
}

export interface BraintreeCheckoutRequest {
  nonce: string;
  amount: number;
  currency?: string;
  invoiceId?: string;
}

export type BraintreeCheckoutResponse =
  | {
      status: 'succeeded';
      transactionId: string;
      amount: string;
      currency: string;
    }
  | {
      status: 'failed';
      message: string;
      code?: string;
    };

export type PayPalPaymentStatus = 'succeeded' | 'failed' | 'cancelled';

export interface PayPalPaymentResult {
  status: PayPalPaymentStatus;
  transactionId?: string;
  error?: string;
}