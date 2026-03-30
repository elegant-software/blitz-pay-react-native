export const config = {
  keycloakUrl: process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  keycloakRealm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM ?? 'blitzpay',
  keycloakClientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'blitzpay-spa',
  authBypass: process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
};
