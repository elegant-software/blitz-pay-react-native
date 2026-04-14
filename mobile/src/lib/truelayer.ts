import { Platform } from 'react-native';
import { config } from './config';
import { storage } from './storage';

const ACTIVE_PAYMENT_STORAGE_KEY = 'truelayer_active_payment';
const PENDING_RETURN_URL_STORAGE_KEY = 'truelayer_pending_return_url';

type TrueLayerEnvironment = 'sandbox' | 'production';

export interface TrueLayerPaymentContext {
  paymentId: string;
  resourceToken: string;
  redirectUri: string;
  preferredCountryCode?: string;
  environment: TrueLayerEnvironment;
}

interface CreateTrueLayerPaymentInput {
  accessToken?: string | null;
  amount: number;
  currency?: string;
  merchantName: string;
  invoiceId?: string;
  redirectUri: string;
}

interface PaymentRequestResponse {
  paymentId: string;
  resourceToken: string;
  redirectUri: string;
  preferredCountryCode?: string;
  environment: TrueLayerEnvironment;
}

function normalizeEnvironment(value: unknown): TrueLayerEnvironment {
  return String(value).toLowerCase() === 'production' ? 'production' : 'sandbox';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function readString(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!record) return undefined;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function parsePaymentResponse(payload: unknown, fallbackRedirectUri: string): PaymentRequestResponse {
  const root = asRecord(payload);
  const nestedPayment = asRecord(root?.payment);
  const nestedData = asRecord(root?.data);
  const nestedPaymentData = asRecord(nestedData?.payment);
  const sources = [root, nestedPayment, nestedData, nestedPaymentData];

  const paymentId = sources
    .map((source) => readString(source, ['paymentId', 'payment_id', 'id']))
    .find(Boolean);
  const resourceToken = sources
    .map((source) => readString(source, ['resourceToken', 'resource_token', 'token']))
    .find(Boolean);
  const redirectUri = sources
    .map((source) => readString(source, ['redirectUri', 'redirect_uri', 'returnUri', 'return_uri']))
    .find(Boolean) ?? fallbackRedirectUri;
  const preferredCountryCode = sources
    .map((source) => readString(source, ['preferredCountryCode', 'preferred_country_code', 'countryCode', 'country_code']))
    .find(Boolean);
  const environment = normalizeEnvironment(
    sources
      .map((source) => readString(source, ['environment', 'env']))
      .find(Boolean) ?? config.trueLayerEnvironment,
  );

  if (!paymentId || !resourceToken) {
    throw new Error('TrueLayer payment request response is missing payment identifiers.');
  }

  return {
    paymentId,
    resourceToken,
    redirectUri,
    preferredCountryCode,
    environment,
  };
}

export function buildTrueLayerRedirectUri(): string {
  return `${config.trueLayerRedirectScheme}://checkout/truelayer-return`;
}

export function isTrueLayerRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(buildTrueLayerRedirectUri());
}

export async function createTrueLayerPayment(
  input: CreateTrueLayerPaymentInput,
): Promise<PaymentRequestResponse> {
  const response = await fetch(config.trueLayerPaymentRequestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : {}),
    },
    body: JSON.stringify({
      amount: Number(input.amount.toFixed(2)),
      amountInMinor: Math.round(input.amount * 100),
      currency: input.currency ?? 'EUR',
      invoiceId: input.invoiceId,
      merchantName: input.merchantName,
      paymentProvider: 'truelayer',
      provider: 'truelayer',
      platform: Platform.OS,
      source: 'mobile-app',
      redirectUri: input.redirectUri,
      returnUri: input.redirectUri,
    }),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : readString(asRecord(payload), ['message', 'error', 'detail']) ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return parsePaymentResponse(payload, input.redirectUri);
}

export async function saveActiveTrueLayerPayment(context: TrueLayerPaymentContext): Promise<void> {
  await storage.setItem(ACTIVE_PAYMENT_STORAGE_KEY, JSON.stringify(context));
}

export async function getActiveTrueLayerPayment(): Promise<TrueLayerPaymentContext | null> {
  const raw = await storage.getItem(ACTIVE_PAYMENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TrueLayerPaymentContext;
  } catch {
    await storage.deleteItem(ACTIVE_PAYMENT_STORAGE_KEY);
    return null;
  }
}

export async function clearActiveTrueLayerPayment(): Promise<void> {
  await storage.deleteItem(ACTIVE_PAYMENT_STORAGE_KEY);
}

export async function savePendingTrueLayerReturnUrl(url: string): Promise<void> {
  await storage.setItem(PENDING_RETURN_URL_STORAGE_KEY, url);
}

export async function consumePendingTrueLayerReturnUrl(): Promise<string | null> {
  const url = await storage.getItem(PENDING_RETURN_URL_STORAGE_KEY);
  if (url) {
    await storage.deleteItem(PENDING_RETURN_URL_STORAGE_KEY);
  }
  return url;
}
