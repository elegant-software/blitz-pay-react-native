import { config } from '../lib/config';
import type {
  BraintreeCheckoutRequest,
  BraintreeCheckoutResponse,
  BraintreeClientTokenResponse,
} from '../types/braintree';

const SALE_TIMEOUT_MS = 30_000;

async function fetchJson<T>(url: string, init: RequestInit, timeoutMs = SALE_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Server returned ${response.status}: ${text}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchClientToken(): Promise<string> {
  const url = 'https://api-blitzpay-staging.elegantsoftware.de/v1/payments/braintree/client-token';
  const data = await fetchJson<BraintreeClientTokenResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!data.clientToken) {
    throw new Error('Missing clientToken in response');
  }
  return data.clientToken;
}

export async function submitNonce(
  request: BraintreeCheckoutRequest,
): Promise<BraintreeCheckoutResponse> {
  const url = 'https://api-blitzpay-staging.elegantsoftware.de/v1/payments/braintree/checkout';
  return fetchJson<BraintreeCheckoutResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
