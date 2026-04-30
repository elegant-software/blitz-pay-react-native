import { authedFetch, type AuthedFetchInit } from './authedFetch';

export const API_VERSION = 'v1';

function withVersion(path: string): string {
  return path.startsWith('/') ? `/${API_VERSION}${path}` : `/${API_VERSION}/${path}`;
}

export async function fetchMerchantCommerceJson<T>(
  path: string,
  init: AuthedFetchInit = {},
): Promise<T> {
  const response = await authedFetch(withVersion(path), init);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${response.status}:${body.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}
