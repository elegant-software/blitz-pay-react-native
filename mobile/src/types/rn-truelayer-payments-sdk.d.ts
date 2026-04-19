declare module 'rn-truelayer-payments-sdk' {
  export enum Environment {
    Sandbox = 'sandbox',
    Production = 'production',
  }

  export enum ResultType {
    Success = 'success',
    Failure = 'failure',
  }

  export type TrueLayerResult = {
    type: ResultType;
    step?: string;
    reason?: string;
  };

  export type PaymentContext = {
    paymentId: string;
    resourceToken: string;
    redirectUri: string;
  };

  export type PaymentPreferences = {
    shouldPresentResultScreen?: boolean;
    preferredCountryCode?: string;
  };

  export const TrueLayerPaymentsSDKWrapper: {
    configure(environment: Environment): Promise<void>;
    processPayment(
      context: PaymentContext,
      preferences?: PaymentPreferences
    ): Promise<TrueLayerResult>;
  };
}
