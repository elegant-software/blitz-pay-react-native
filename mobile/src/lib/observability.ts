import { AppState, Platform } from 'react-native';
import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type AttributeValue = string | number | boolean;
type InputAttributeValue = AttributeValue | null | undefined;

interface LogAttributes {
  [key: string]: InputAttributeValue;
}

interface ObservabilityEvent {
  timestamp: string;
  severityText: string;
  message: string;
  attributes?: Record<string, AttributeValue>;
  exception?: {
    type?: string;
    message?: string;
    stack?: string;
    isFatal?: boolean;
  };
}

interface ObservabilityEnvelope {
  context: {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    sessionId: string;
    osName: string;
    osVersion: string;
  };
  events: ObservabilityEvent[];
}

interface ErrorUtilsLike {
  getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
}

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 50;
const MAX_QUEUE_SIZE = 500;
const MAX_MESSAGE_LENGTH = 2_000;
const SENSITIVE_KEY_PATTERN = /(pass(word)?|token|secret|authorization|cookie)/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

let initialized = false;
let inFlight = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let globalErrorRestorer: (() => void) | null = null;
let eventQueue: ObservabilityEvent[] = [];

const originalConsole = {
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function sanitizeText(value: string): string {
  return value.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]').replace(BEARER_PATTERN, 'Bearer [REDACTED_TOKEN]');
}

function sanitizeAttributes(attributes?: LogAttributes): Record<string, AttributeValue> | undefined {
  if (!attributes) return undefined;
  const sanitized: Record<string, AttributeValue> = {};

  for (const [key, rawValue] of Object.entries(attributes)) {
    if (rawValue == null) continue;
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    if (typeof rawValue === 'string') {
      sanitized[key] = sanitizeText(rawValue).slice(0, MAX_MESSAGE_LENGTH);
      continue;
    }
    sanitized[key] = rawValue;
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
}

function serializeConsoleArgs(args: unknown[]): string {
  return args.map((arg) => {
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}`;
    }
    if (typeof arg === 'string') {
      return arg;
    }
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');
}

function toSeverityText(level: LogLevel): string {
  return level.toUpperCase();
}

function shouldSample(): boolean {
  return Math.random() <= config.observabilitySampleRate;
}

function enqueue(event: ObservabilityEvent): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    eventQueue = eventQueue.slice(eventQueue.length - MAX_QUEUE_SIZE + 1);
  }
  eventQueue.push(event);
}

function buildIngestUrl(): string {
  const base = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
  const path = config.observabilityIngestPath.startsWith('/')
    ? config.observabilityIngestPath
    : `/${config.observabilityIngestPath}`;
  return `${base}${path}`;
}

function contextForPayload(): ObservabilityEnvelope['context'] {
  return {
    serviceName: config.observabilityServiceName,
    serviceVersion: config.observabilityServiceVersion,
    environment: config.observabilityEnvironment,
    sessionId,
    osName: Platform.OS,
    osVersion: String(Platform.Version),
  };
}

async function flushBatch(trigger: string): Promise<void> {
  if (!config.observabilityEnabled || inFlight || eventQueue.length === 0) return;

  const batch = eventQueue.slice(0, MAX_BATCH_SIZE);
  eventQueue = eventQueue.slice(batch.length);
  inFlight = true;

  try {
    const envelope: ObservabilityEnvelope = {
      context: contextForPayload(),
      events: batch,
    };

    const response = await fetch(buildIngestUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
    });

    if (!response.ok) {
      throw new Error(`observability_ingest_failed_${response.status}`);
    }
  } catch {
    eventQueue = [...batch, ...eventQueue].slice(0, MAX_QUEUE_SIZE);
  } finally {
    inFlight = false;
  }

  if (trigger !== 'interval' && eventQueue.length > 0) {
    void flushBatch('drain');
  }
}

function record(level: LogLevel, message: string, attributes?: LogAttributes, error?: Error, isFatal?: boolean): void {
  if (!config.observabilityEnabled || !shouldSample()) return;
  const sanitizedMessage = sanitizeText(message).slice(0, MAX_MESSAGE_LENGTH);

  enqueue({
    timestamp: new Date().toISOString(),
    severityText: toSeverityText(level),
    message: sanitizedMessage,
    attributes: sanitizeAttributes(attributes),
    exception: error ? {
      type: error.name,
      message: sanitizeText(error.message).slice(0, MAX_MESSAGE_LENGTH),
      stack: error.stack ? sanitizeText(error.stack).slice(0, MAX_MESSAGE_LENGTH * 2) : undefined,
      isFatal,
    } : undefined,
  });
}

function installConsoleCapture(): void {
  if (!config.observabilityCaptureConsole) return;

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    record('warn', serializeConsoleArgs(args), { source: 'console.warn' });
  };

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    const possibleError = args.find((arg) => arg instanceof Error);
    record(
      'error',
      serializeConsoleArgs(args),
      { source: 'console.error' },
      possibleError instanceof Error ? possibleError : undefined,
    );
  };
}

function installGlobalErrorCapture(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!errorUtils?.getGlobalHandler || !errorUtils?.setGlobalHandler) return;

  const previousHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    record('error', `Unhandled JS error: ${error.message}`, { source: 'global_error' }, error, isFatal);
    previousHandler?.(error, isFatal);
  });

  globalErrorRestorer = () => {
    if (previousHandler) {
      errorUtils.setGlobalHandler(previousHandler);
    }
  };
}

function installFlushHooks(): void {
  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState !== 'active') {
      void flushBatch(`app_state_${nextState}`);
    }
  });

  flushTimer = setInterval(() => {
    void flushBatch('interval');
  }, FLUSH_INTERVAL_MS);
}

export function initObservability(): void {
  if (initialized || !config.observabilityEnabled) return;

  initialized = true;
  installConsoleCapture();
  installGlobalErrorCapture();
  installFlushHooks();
  record('info', 'mobile_observability_initialized', {
    platform: Platform.OS,
    environment: config.observabilityEnvironment,
  });
}

export async function flushObservability(): Promise<void> {
  await flushBatch('manual');
}

export function shutdownObservability(): void {
  flushTimer && clearInterval(flushTimer);
  flushTimer = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  globalErrorRestorer?.();
  globalErrorRestorer = null;
  initialized = false;
}

export const observability = {
  debug: (message: string, attributes?: LogAttributes) => record('debug', message, attributes),
  info: (message: string, attributes?: LogAttributes) => record('info', message, attributes),
  warn: (message: string, attributes?: LogAttributes, error?: Error) => record('warn', message, attributes, error),
  error: (message: string, attributes?: LogAttributes, error?: Error) => record('error', message, attributes, error),
};
