import { authedFetch } from '../api/authedFetch';
import { observability } from '../observability';
import { mapBackendStatus, type PaymentResult } from './types';

export type StatusOutcome =
  | { kind: 'terminal'; result: PaymentResult }
  | { kind: 'non_terminal'; status?: string };

interface FetchOptions {
  signal?: AbortSignal;
}

interface RawStatusResponse {
  paymentRequestId?: string;
  status?: string;
  terminal?: boolean;
  lastEventAt?: string;
}

export async function fetchPaymentStatus(
  paymentRequestId: string,
  options: FetchOptions = {}
): Promise<StatusOutcome> {
  let response: Response;
  try {
    response = await authedFetch(`/v1/payments/${encodeURIComponent(paymentRequestId)}`, {
      method: 'GET',
      signal: options.signal,
    });
  } catch (err) {
    observability.debug('payment_status_network_error', {
      paymentRequestId,
      message: err instanceof Error ? err.message : String(err),
    });
    return { kind: 'non_terminal' };
  }

  // 404 = no status record yet (payment too new). Keep polling.
  if (response.status === 404) {
    observability.debug('payment_status_not_found_yet', { paymentRequestId });
    return { kind: 'non_terminal' };
  }

  if (!response.ok) {
    observability.debug('payment_status_non_ok', {
      paymentRequestId,
      status: response.status,
    });
    return { kind: 'non_terminal' };
  }

  let payload: RawStatusResponse;
  try {
    payload = (await response.json()) as RawStatusResponse;
  } catch {
    return { kind: 'non_terminal' };
  }

  const mapped = mapBackendStatus(payload.status);
  const isTerminal = payload.terminal === true && mapped !== null;

  if (isTerminal && mapped) {
    const result: PaymentResult = {
      paymentRequestId: payload.paymentRequestId ?? paymentRequestId,
      status: mapped,
      updatedAt: payload.lastEventAt,
    };
    return { kind: 'terminal', result };
  }

  return { kind: 'non_terminal', status: payload.status };
}
