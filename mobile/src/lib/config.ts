function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  keycloakUrl: process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  keycloakRealm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM ?? 'blitzpay',
  keycloakClientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'blitzpay-spa',
  authBypass: process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  observabilityEnabled: parseBoolean(process.env.EXPO_PUBLIC_OBSERVABILITY_ENABLED, false),
  observabilityEnvironment: process.env.EXPO_PUBLIC_OBSERVABILITY_ENVIRONMENT ?? 'development',
  observabilityServiceName: process.env.EXPO_PUBLIC_OBSERVABILITY_SERVICE_NAME ?? 'blitzpay-mobile',
  observabilityServiceVersion: process.env.EXPO_PUBLIC_OBSERVABILITY_SERVICE_VERSION ?? '1.0.0',
  observabilityIngestPath: process.env.EXPO_PUBLIC_OBSERVABILITY_INGEST_PATH ?? '/api/observability/mobile-logs',
  observabilitySampleRate: Math.min(1, Math.max(0, parseNumber(process.env.EXPO_PUBLIC_OBSERVABILITY_SAMPLE_RATE, 1))),
  observabilityCaptureConsole: parseBoolean(process.env.EXPO_PUBLIC_OBSERVABILITY_CAPTURE_CONSOLE, true),
};
