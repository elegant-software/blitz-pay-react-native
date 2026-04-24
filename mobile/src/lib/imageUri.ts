import { config } from './config';

export type ResolvedImageUri = { uri: string; needsAuth: boolean };

export function resolveImageUri(rawUri?: string): ResolvedImageUri | undefined {
  if (!rawUri) return undefined;
  if (/^https?:\/\//i.test(rawUri)) return { uri: rawUri, needsAuth: false };
  const baseUrl = config.apiUrl.replace(/\/+$/, '');
  const path = rawUri.startsWith('/') ? rawUri : `/${rawUri}`;
  return { uri: `${baseUrl}${path}`, needsAuth: true };
}
