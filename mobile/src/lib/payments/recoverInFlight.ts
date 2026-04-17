import { MAX_WAIT_MS } from './constants';
import { inFlightStore } from './inFlightStore';
import { fetchPaymentStatus } from './paymentStatusClient';
import { paymentResultTracker } from './paymentResultTracker';
import { observability } from '../observability';

export async function recoverInFlight(): Promise<void> {
  let records;
  try {
    records = await inFlightStore.list();
  } catch {
    return;
  }
  if (records.length === 0) return;

  observability.info('payment_inflight_recovery_started', { count: records.length });

  const now = Date.now();
  for (const record of records) {
    const elapsed = now - record.startedAt;
    let outcome;
    try {
      outcome = await fetchPaymentStatus(record.paymentRequestId);
    } catch {
      outcome = { kind: 'non_terminal' as const };
    }

    if (outcome.kind === 'terminal') {
      paymentResultTracker.applyRecoveredResult(outcome.result);
      continue;
    }

    // Still non-terminal. If we're within the original max-wait window, re-arm
    // the tracker with the remaining budget; otherwise drop the record.
    if (elapsed < MAX_WAIT_MS) {
      void paymentResultTracker.start(record.paymentRequestId, {
        persist: false,
        startedAt: record.startedAt,
      });
    }
    // else: leave the record in place so a later push can still deliver the
    // real result; inFlightStore.list() will GC anything older than MAX_WAIT_MS*2.
  }
}
