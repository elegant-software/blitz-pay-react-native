import { observability } from '../observability';

export type PaymentResultEvent =
  | 'payment_result_push_received'
  | 'payment_result_poll_terminal'
  | 'payment_result_timeout'
  | 'payment_result_duplicate_suppressed'
  | 'payment_result_recovered';

type AttrValue = string | number | boolean | null | undefined;

export function trackPaymentResultEvent(
  name: PaymentResultEvent,
  props: Record<string, AttrValue> = {}
): void {
  observability.info(name, props);
}
