import { useState, useCallback } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { initializeStripePaymentSheet, StripeParams } from '../services/stripe';

export const useStripePayment = () => {
  const { presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePayment = useCallback(async (params: StripeParams) => {
    setLoading(true);
    setError(null);
    try {
      await initializeStripePaymentSheet(params);
    } catch (e: any) {
      setError(e.message || 'Failed to initialize payment sheet');
    } finally {
      setLoading(false);
    }
  }, []);

  const openPaymentSheet = useCallback(async () => {
    setLoading(true);
    try {
      const { error: stripeError } = await presentPaymentSheet();

      if (stripeError) {
        if (stripeError.code === 'Canceled') {
          return { status: 'canceled' };
        }
        setError(stripeError.message);
        return { status: 'failed', error: stripeError.message };
      }

      return { status: 'succeeded' };
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
      return { status: 'failed', error: e.message };
    } finally {
      setLoading(false);
    }
  }, [presentPaymentSheet]);

  return {
    initializePayment,
    openPaymentSheet,
    loading,
    error,
  };
};
