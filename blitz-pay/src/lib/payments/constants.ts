export const INITIAL_WAIT_MS = 5000;
export const MAX_WAIT_MS = 60_000;
export const BACKOFF_SCHEDULE_MS: readonly number[] = [2000, 3000, 5000, 8000, 13000, 21000];

export const INFLIGHT_STORAGE_KEY = 'blitzpay_inflight_payments';
export const PUSH_TOKEN_STORAGE_KEY = 'blitzpay_push_token';
export const PAYMENTS_CHANNEL_ID = 'payments';
