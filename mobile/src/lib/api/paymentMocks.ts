import { StripeParams } from '../../services/stripe';

export const mockCreatePaymentIntent = async (params: {
  amount: number;
  currency: string;
}): Promise<StripeParams> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    paymentIntent: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
    ephemeralKey: 'ek_mock_secret_' + Math.random().toString(36).substring(7),
    customer: 'cus_mock_' + Math.random().toString(36).substring(7),
    publishableKey: 'pk_test_mock',
  };
};
