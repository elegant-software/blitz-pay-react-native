import * as Notifications from 'expo-notifications';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { observability } from '../observability';
import { paymentResultTracker } from '../payments/paymentResultTracker';
import { fetchPaymentStatus } from '../payments/paymentStatusClient';
import type { PaymentResultPushData } from '../payments/types';
import { mapBackendStatus, isTerminalStatus } from '../payments/types';
import type { RootStackParamList } from '../../types';

type NavRef = NavigationContainerRefWithCurrent<RootStackParamList>;

interface ParsedPush {
  paymentRequestId: string;
  terminal: PaymentResultPushData | null;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Foreground presentation: show banner + play sound so payment results are visible
// even while the app is open (the default RN behavior is to suppress them).
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function parsePush(data: unknown): ParsedPush | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const paymentRequestId = record.paymentRequestId;
  if (typeof paymentRequestId !== 'string' || !paymentRequestId) return null;
  if (record.type !== undefined && record.type !== 'payment_result') return null;

  const rawStatus = record.status;
  const mapped = mapBackendStatus(rawStatus);
  if (mapped && isTerminalStatus(mapped)) {
    const reason = typeof record.reason === 'string' ? record.reason : null;
    return {
      paymentRequestId,
      terminal: {
        type: 'payment_result',
        paymentRequestId,
        status: mapped,
        reason,
      },
    };
  }
  // Direct UI status (already mapped by server)
  if (isTerminalStatus(rawStatus)) {
    const reason = typeof record.reason === 'string' ? record.reason : null;
    return {
      paymentRequestId,
      terminal: {
        type: 'payment_result',
        paymentRequestId,
        status: rawStatus,
        reason,
      },
    };
  }
  return { paymentRequestId, terminal: null };
}

async function pollAndApply(paymentRequestId: string): Promise<PaymentResultPushData | null> {
  try {
    const outcome = await fetchPaymentStatus(paymentRequestId);
    if (outcome.kind === 'terminal') {
      const data: PaymentResultPushData = {
        type: 'payment_result',
        paymentRequestId,
        status: outcome.result.status,
        reason: outcome.result.reason ?? null,
      };
      paymentResultTracker.applyPush(data);
      return data;
    }
  } catch (err) {
    observability.debug('push_triggered_poll_error', {
      paymentRequestId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

function navigateToResult(navigationRef: NavRef | null, data: PaymentResultPushData): void {
  if (!navigationRef || !navigationRef.isReady()) return;
  try {
    navigationRef.navigate('PaymentResult', {
      paymentRequestId: data.paymentRequestId,
      status: data.status,
      reason: data.reason ?? undefined,
    });
  } catch (err) {
    observability.debug('push_navigate_failed', {
      paymentRequestId: data.paymentRequestId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

async function handleIncoming(
  parsed: ParsedPush,
  navigationRef: NavRef | null,
  shouldNavigate: boolean
): Promise<void> {
  let terminal = parsed.terminal;
  if (terminal) {
    paymentResultTracker.applyPush(terminal);
  } else {
    terminal = await pollAndApply(parsed.paymentRequestId);
  }
  if (terminal && shouldNavigate) {
    navigateToResult(navigationRef, terminal);
  }
}

let initialized = false;
let subscriptions: Array<{ remove: () => void }> = [];

export function initPushHandlers(navigationRef: NavRef): () => void {
  if (initialized) return () => undefined;
  initialized = true;

  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const parsed = parsePush(notification.request.content.data);
    if (!parsed) return;
    observability.debug('push_received_foreground', {
      paymentRequestId: parsed.paymentRequestId,
      hasTerminal: parsed.terminal !== null,
    });
    void handleIncoming(parsed, navigationRef, false);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const parsed = parsePush(response.notification.request.content.data);
    if (!parsed) return;
    observability.debug('push_tapped', {
      paymentRequestId: parsed.paymentRequestId,
      hasTerminal: parsed.terminal !== null,
    });
    void handleIncoming(parsed, navigationRef, true);
  });

  subscriptions = [receivedSub, responseSub];

  // Cold-start: if the app was launched by tapping a notification, replay it.
  void Notifications.getLastNotificationResponseAsync().then(async (response) => {
    if (!response) return;
    const parsed = parsePush(response.notification.request.content.data);
    if (!parsed) return;
    observability.debug('push_coldstart', {
      paymentRequestId: parsed.paymentRequestId,
      hasTerminal: parsed.terminal !== null,
    });
    const tryNavigate = (data: PaymentResultPushData) => {
      if (navigationRef.isReady()) {
        navigateToResult(navigationRef, data);
      } else {
        setTimeout(() => tryNavigate(data), 50);
      }
    };
    if (parsed.terminal) {
      paymentResultTracker.applyPush(parsed.terminal);
      tryNavigate(parsed.terminal);
    } else {
      const data = await pollAndApply(parsed.paymentRequestId);
      if (data) tryNavigate(data);
    }
  });

  return () => {
    subscriptions.forEach((sub) => sub.remove());
    subscriptions = [];
    initialized = false;
  };
}
