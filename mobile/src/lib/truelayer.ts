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

function generateUuid(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

function extractPaymentContext(payload: PaymentApiResponse): {
  paymentId?: string;
  resourceToken?: string;
  redirectUri?: string;
  preferredCountryCode?: string;
  environment?: Environment;
  paymentRequestId?: string;
} {
  const payment = typeof payload.payment === 'object' && payload.payment ? (payload.payment as PaymentApiResponse) : undefined;
  const source = payment ?? payload;

  return {
    paymentId: readString(source, ['paymentId', 'payment_id', 'id']),
    resourceToken: readString(source, ['resourceToken', 'resource_token']),
    redirectUri: readString(source, ['redirectUri', 'redirect_uri', 'redirectReturnUri']),
    preferredCountryCode: readString(source, ['preferredCountryCode', 'preferred_country_code']),
    environment: source.environment != null ? getEnvironment(source.environment) : undefined,
    paymentRequestId: readString(source, ['paymentRequestId', 'payment_request_id']),
  };
}


async function createPaymentRequest({
  token,
  amount,
  merchantName,
  invoiceId,
  user,
}: PaymentRequestParams): Promise<PaymentInitResponse> {
  const redirectUri = getRedirectUri();
  const hasToken = Boolean(token);

  const paymentRequestId = generateUuid();
  const orderId = invoiceId ?? `order_${paymentRequestId}`;
  const userDisplayName = user?.name ?? user?.email ?? 'BlitzPay Customer';

  const amountMinorUnits = Math.round(amount * 100);
  const requestBody = {
    paymentRequestId,
    orderId,
    amountMinorUnits,
    currency: 'GBP',
    userDisplayName,
    redirectReturnUri: redirectUri,
  };

  observability.info('truelayer_payment_request_started', {
    url: config.trueLayerPaymentsUrl,
    paymentRequestId,
    orderId,
    amount,
    amountMinorUnits,
    currency: requestBody.currency,
    userDisplayName,
    redirectReturnUri: redirectUri,
    hasToken,
    platform: Platform.OS,
    requestBody: JSON.stringify(requestBody),
  });

  let response: Response;
  try {
    response = await fetch(config.trueLayerPaymentsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });
  } catch (networkError) {
    observability.error(
      'truelayer_payment_request_network_error',
      {
        url: config.trueLayerPaymentsUrl,
        message: networkError instanceof Error ? networkError.message : String(networkError),
      },
      networkError instanceof Error ? networkError : undefined
    );
    throw new Error('truelayer_request_failed');
  }

  if (!response.ok) {
    const bodySnippet = await response
      .text()
      .then((text) => text.slice(0, 4000))
      .catch(() => '');
    observability.error('truelayer_payment_request_failed', {
      status: response.status,
      url: config.trueLayerPaymentsUrl,
      paymentRequestId,
      orderId,
      requestBody: JSON.stringify(requestBody),
      body: bodySnippet,
    });
    throw new Error(response.status === 401 ? 'session_expired' : 'truelayer_request_failed');
  }

  const payload = (await response.json().catch((err) => {
    observability.warn('truelayer_payment_response_parse_failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    return {};
  })) as PaymentApiResponse;

  const context = extractPaymentContext(payload);
  observability.info('truelayer_payment_request_response_received', {
    paymentRequestId: context.paymentRequestId ?? paymentRequestId,
    hasPaymentId: Boolean(context.paymentId),
    hasResourceToken: Boolean(context.resourceToken),
    payloadKeys: Object.keys(payload ?? {}).join(','),
  });

  if (!context.paymentId || !context.resourceToken) {
    observability.error('truelayer_invalid_response', {
      paymentRequestId: context.paymentRequestId ?? paymentRequestId,
      hasPaymentId: Boolean(context.paymentId),
      hasResourceToken: Boolean(context.resourceToken),
      payloadKeys: Object.keys(payload ?? {}).join(','),
      hint: 'Backend must return paymentId and resourceToken in POST /v1/payments/request response.',
    });
    throw new Error('truelayer_invalid_response');
  }

  const normalized: PaymentInitResponse = {
    paymentId: context.paymentId,
    resourceToken: context.resourceToken,
    redirectUri: context.redirectUri ?? redirectUri,
    preferredCountryCode: context.preferredCountryCode ?? config.trueLayerPreferredCountryCode,
    environment: context.environment ?? getEnvironment(config.trueLayerEnvironment),
  };

  observability.info('truelayer_payment_request_succeeded', {
    paymentId: normalized.paymentId,
    environment: String(normalized.environment),
    redirectUri: normalized.redirectUri,
    preferredCountryCode: normalized.preferredCountryCode ?? null,
  });
  return normalized;
}

function normalizeResult(result: TrueLayerResult, context: { paymentId: string; redirectUri: string }): void {
  const rawReason = result.reason ?? '';
  if (result.type === ResultType.Success) {
    observability.info('truelayer_sdk_result_success', {
      paymentId: context.paymentId,
    });
    return;
  }

  const reason = rawReason.toLowerCase();
  if (reason.includes('cancel')) {
    observability.warn('truelayer_sdk_result_cancelled', {
      paymentId: context.paymentId,
      reason: rawReason,
    });
    throw new Error('truelayer_cancelled');
  }

  observability.error('truelayer_sdk_result_failed', {
    paymentId: context.paymentId,
    resultType: String(result.type),
    reason: rawReason,
    redirectUri: context.redirectUri,
  });
  throw new Error('truelayer_failed');
}

export async function startTrueLayerPayment(params: PaymentRequestParams): Promise<void> {
  if (Platform.OS === 'web') {
    observability.warn('truelayer_unsupported_platform', { platform: Platform.OS });
    throw new Error('truelayer_unsupported_platform');
  }

  const context = await createPaymentRequest(params);

  try {
    observability.debug('truelayer_sdk_configure_started', {
      environment: String(context.environment),
    });
    await TrueLayerPaymentsSDKWrapper.configure(context.environment);
  } catch (err) {
    observability.error(
      'truelayer_sdk_configure_failed',
      {
        environment: String(context.environment),
        message: err instanceof Error ? err.message : String(err),
      },
      err instanceof Error ? err : undefined
    );
    throw new Error('truelayer_failed');
  }

  observability.info('truelayer_sdk_process_payment_started', {
    paymentId: context.paymentId,
    environment: String(context.environment),
    redirectUri: context.redirectUri,
    preferredCountryCode: context.preferredCountryCode ?? null,
  });

  let result: TrueLayerResult;
  try {
    result = await TrueLayerPaymentsSDKWrapper.processPayment(
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
  } catch (err) {
    observability.error(
      'truelayer_sdk_process_payment_threw',
      {
        paymentId: context.paymentId,
        redirectUri: context.redirectUri,
        message: err instanceof Error ? err.message : String(err),
      },
      err instanceof Error ? err : undefined
    );
    throw new Error('truelayer_failed');
  }

  normalizeResult(result, { paymentId: context.paymentId, redirectUri: context.redirectUri });
}
