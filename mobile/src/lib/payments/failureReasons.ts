// Maps TrueLayer SDK FailureReason codes (and raw backend reason strings) to
// a small set of user-facing translation keys. Keep the buckets coarse — the
// user needs to know what to do next, not the exact SDK enum.

export type FailureBucketKey =
  | 'truelayer_reason_connectivity'
  | 'truelayer_reason_provider_unavailable'
  | 'truelayer_reason_provider_declined'
  | 'truelayer_reason_insufficient_funds'
  | 'truelayer_reason_invalid_credentials'
  | 'truelayer_reason_invalid_account'
  | 'truelayer_reason_wait_abandoned'
  | 'truelayer_reason_configuration'
  | 'truelayer_reason_unknown'
  | 'truelayer_cancelled';

const REASON_TO_BUCKET: Record<string, FailureBucketKey> = {
  // Cancellation
  UserAborted: 'truelayer_cancelled',
  UserCanceledAtProvider: 'truelayer_cancelled',

  // Connectivity / transport
  NoInternet: 'truelayer_reason_connectivity',
  CommunicationIssue: 'truelayer_reason_connectivity',
  ConnectionSecurityIssue: 'truelayer_reason_connectivity',

  // Bank side unavailable
  ProviderOffline: 'truelayer_reason_provider_unavailable',
  ProviderExpired: 'truelayer_reason_provider_unavailable',
  SchemeUnavailable: 'truelayer_reason_provider_unavailable',

  // Bank declined
  ProviderError: 'truelayer_reason_provider_declined',
  ProviderRejected: 'truelayer_reason_provider_declined',
  Blocked: 'truelayer_reason_provider_declined',
  VerificationDeclined: 'truelayer_reason_provider_declined',

  // Funds / limits
  InsufficientFunds: 'truelayer_reason_insufficient_funds',
  PaymentLimitExceeded: 'truelayer_reason_insufficient_funds',

  // Credentials / OTP
  InvalidCredentials: 'truelayer_reason_invalid_credentials',
  InvalidOtp: 'truelayer_reason_invalid_credentials',

  // Account details
  InvalidAccountDetails: 'truelayer_reason_invalid_account',
  InvalidAccountHolderName: 'truelayer_reason_invalid_account',
  InvalidRemitterAccount: 'truelayer_reason_invalid_account',
  InvalidBeneficiaryAccount: 'truelayer_reason_invalid_account',
  InvalidSortCode: 'truelayer_reason_invalid_account',

  // User waited too long on the bank page
  WaitAbandoned: 'truelayer_reason_wait_abandoned',

  // Our-side / integration issues
  InvalidRedirectURI: 'truelayer_reason_configuration',
  ProcessorContextNotAvailable: 'truelayer_reason_configuration',
  InvalidRequest: 'truelayer_reason_configuration',
  InvalidMandateState: 'truelayer_reason_configuration',
  ConstraintViolation: 'truelayer_reason_configuration',

  // Generic
  PaymentFailed: 'truelayer_reason_unknown',
  Unknown: 'truelayer_reason_unknown',
};

export function resolveFailureReasonKey(
  reason: string | null | undefined
): FailureBucketKey | null {
  if (!reason) return null;
  const direct = REASON_TO_BUCKET[reason];
  if (direct) return direct;
  // Tolerate loose casing / whitespace from non-SDK sources (backend/push).
  const normalized = reason.trim().replace(/\s+/g, '');
  for (const key of Object.keys(REASON_TO_BUCKET)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return REASON_TO_BUCKET[key];
    }
  }
  if (/cancel/i.test(reason)) return 'truelayer_cancelled';
  return null;
}
