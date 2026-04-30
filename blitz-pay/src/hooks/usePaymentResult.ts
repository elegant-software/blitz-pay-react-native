import { useEffect, useState } from 'react';
import { paymentResultTracker } from '../lib/payments/paymentResultTracker';
import type { PaymentResult, TrackerSource } from '../lib/payments/types';

export type UsePaymentResultState =
  | { status: 'processing' }
  | { status: 'timeout' }
  | {
      status: 'succeeded' | 'failed' | 'cancelled';
      result: PaymentResult;
      source: TrackerSource;
    };

export function usePaymentResult(paymentRequestId: string | undefined): UsePaymentResultState {
  const [state, setState] = useState<UsePaymentResultState>({ status: 'processing' });

  useEffect(() => {
    if (!paymentRequestId) return;
    let active = true;

    const unsubscribe = paymentResultTracker.subscribe((resolution) => {
      if (!active) return;
      if (resolution.kind === 'timeout') {
        if (resolution.paymentRequestId !== paymentRequestId) return;
        setState({ status: 'timeout' });
        return;
      }
      if (resolution.result.paymentRequestId !== paymentRequestId) return;
      setState({
        status: resolution.result.status,
        result: resolution.result,
        source: resolution.source,
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [paymentRequestId]);

  return state;
}
