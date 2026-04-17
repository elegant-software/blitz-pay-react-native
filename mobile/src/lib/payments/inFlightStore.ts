import { storage } from '../storage';
import { INFLIGHT_STORAGE_KEY, MAX_WAIT_MS } from './constants';

export interface InFlightPaymentRecord {
  paymentRequestId: string;
  startedAt: number;
  lastPolledAt?: number;
}

const ABANDON_AFTER_MS = MAX_WAIT_MS * 2;

async function readAll(): Promise<InFlightPaymentRecord[]> {
  try {
    const raw = await storage.getItem(INFLIGHT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is InFlightPaymentRecord =>
        typeof r === 'object' &&
        r !== null &&
        typeof (r as InFlightPaymentRecord).paymentRequestId === 'string' &&
        typeof (r as InFlightPaymentRecord).startedAt === 'number'
    );
  } catch {
    return [];
  }
}

async function writeAll(records: InFlightPaymentRecord[]): Promise<void> {
  try {
    if (records.length === 0) {
      await storage.deleteItem(INFLIGHT_STORAGE_KEY);
      return;
    }
    await storage.setItem(INFLIGHT_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // non-fatal; secure-store may be unavailable on some platforms
  }
}

async function add(record: InFlightPaymentRecord): Promise<void> {
  const current = await readAll();
  const filtered = current.filter((r) => r.paymentRequestId !== record.paymentRequestId);
  filtered.push(record);
  await writeAll(filtered);
}

async function remove(paymentRequestId: string): Promise<void> {
  const current = await readAll();
  const filtered = current.filter((r) => r.paymentRequestId !== paymentRequestId);
  if (filtered.length === current.length) return;
  await writeAll(filtered);
}

async function update(
  paymentRequestId: string,
  patch: Partial<InFlightPaymentRecord>
): Promise<void> {
  const current = await readAll();
  let changed = false;
  const next = current.map((r) => {
    if (r.paymentRequestId !== paymentRequestId) return r;
    changed = true;
    return { ...r, ...patch, paymentRequestId: r.paymentRequestId };
  });
  if (!changed) return;
  await writeAll(next);
}

async function list(): Promise<InFlightPaymentRecord[]> {
  const now = Date.now();
  const current = await readAll();
  const fresh = current.filter((r) => now - r.startedAt < ABANDON_AFTER_MS);
  if (fresh.length !== current.length) {
    await writeAll(fresh);
  }
  return fresh;
}

export const inFlightStore = {
  add,
  remove,
  update,
  list,
};
