import { Platform } from 'react-native';
import {
  Environment,
  ResultType,
  TrueLayerPaymentsSDKWrapper,
  type TrueLayerResult,
} from 'rn-truelayer-payments-sdk';
import { config } from './config';
import { observability } from './observability';

type PaymentRequestParams = {
  token: string | null;
  amount: number;
  merchantName: string;
  invoiceId?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
  } | null;
};

type PaymentInitResponse = {
  paymentId: string;
  resourceToken: string;
  redirectUri: string;
  environment: Environment;
  preferredCountryCode?: string;
};

type PaymentApiResponse = Record<string, unknown>;

function getRedirectUri(): string {
  return `${config.trueLayerRedirectScheme}://${config.trueLayerRedirectHost}/${config.trueLayerRedirectPath}`;
}

function getEnvironment(value: unknown): Environment {
  const normalized = typeof value === 'string' ? value.toLowerCase() : config.trueLayerEnvironment.toLowerCase();
  return normalized === 'production' ? Environment.Production : Environment.Sandbox;
}

function readString(source: PaymentApiResponse, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function normalizePaymentResponse(payload: PaymentApiResponse): PaymentInitResponse {
  const payment = typeof payload.payment === 'object' && payload.payment ? (payload.payment as PaymentApiResponse) : undefined;
  const source = payment ?? payload;

  const paymentId = readString(source, ['paymentId', 'payment_id', 'id']);
  const resourceToken = readString(source, ['resourceToken', 'resource_token']);
  const redirectUri = readString(source, ['redirectUri', 'redirect_uri']) ?? getRedirectUri();
  const preferredCountryCode =
    readString(source, ['preferredCountryCode', 'preferred_country_code']) ?? config.trueLayerPreferredCountryCode;

  if (!paymentId || !resourceToken) {
    throw new Error('truelayer_invalid_response');
  }

  return {
    paymentId,
    resourceToken,
    redirectUri,
    preferredCountryCode,
    environment: getEnvironment(source.environment ?? payload.environment),
  };
}

async function createPaymentRequest({
  token,
  amount,
  merchantName,
  invoiceId,
  user,
}: PaymentRequestParams): Promise<PaymentInitResponse> {
  const response = await fetch(config.trueLayerPaymentsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      amount,
      currency: 'EUR',
      merchantName,
      invoiceId,
      redirectUri: getRedirectUri(),
      provider: 'truelayer',
      paymentMethod: 'bank',
      platform: Platform.OS,
      customer: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        : undefined,
    }),
  });

  if (!response.ok) {
    observability.warn('truelayer_payment_request_failed', {
      status: response.status,
      url: config.trueLayerPaymentsUrl,
    });
    throw new Error(response.status === 401 ? 'session_expired' : 'truelayer_request_failed');
  }

  const payload = (await response.json().catch(() => ({}))) as PaymentApiResponse;
  return normalizePaymentResponse(payload);
}

function normalizeResult(result: TrueLayerResult): void {
  if (result.type === ResultType.Success) {
    return;
  }

  const reason = result.reason?.toLowerCase() ?? 'unknown';
  if (reason.includes('cancel')) {
    throw new Error('truelayer_cancelled');
  }

  throw new Error('truelayer_failed');
}

export async function startTrueLayerPayment(params: PaymentRequestParams): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('truelayer_unsupported_platform');
  }

  const context = await createPaymentRequest(params);
  await TrueLayerPaymentsSDKWrapper.configure(context.environment);

  const result = await TrueLayerPaymentsSDKWrapper.processPayment(
    {
      paymentId: context.paymentId,
      resourceToken: context.resourceToken,
      redirectUri: context.redirectUri,
    },
    {
      shouldPresentResultScreen: true,
      preferredCountryCode: context.preferredCountryCode,
    }
  );

  normalizeResult(result);
}
