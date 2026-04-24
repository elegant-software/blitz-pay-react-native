import { storage } from '../../../lib/storage';
import { fetchMerchantCommerceJson } from '../../../lib/api/merchantCommerce';
import type { GeofenceRegion, NearbyMerchant, NearbyMerchantQuery } from '../types/nearbyMerchant';

const REFRESH_MARKER_KEY = 'nearby_merchants_refresh_at';

type NearbyMerchantResponse = {
  merchants?: Array<{
    merchantId?: string;
    legalBusinessName?: string;
    latitude?: number;
    longitude?: number;
    distanceMeters?: number;
    geofenceRadiusMeters?: number;
    googlePlaceId?: string;
  }>;
};

type MerchantDetailsResponse = {
  logoUrl?: string;
};

type NearbyMerchantEntry = NonNullable<NearbyMerchantResponse['merchants']>[number];

type GeofenceRegionsResponse = {
  regions?: Array<{
    regionId?: string;
    displayName?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    distanceMeters?: number;
  }>;
};

function ensureNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapNearbyMerchant(value: NearbyMerchantEntry): NearbyMerchant | null {
  if (!value?.merchantId || !value.legalBusinessName) return null;
  return {
    merchantId: value.merchantId,
    displayName: value.legalBusinessName,
    latitude: ensureNumber(value.latitude),
    longitude: ensureNumber(value.longitude),
    distanceMeters: ensureNumber(value.distanceMeters),
    geofenceRadiusMeters: ensureNumber(value.geofenceRadiusMeters),
    googlePlaceId: value.googlePlaceId,
  };
}

async function fetchMerchantLogoUrl(merchantId: string): Promise<string | undefined> {
  try {
    const details = await fetchMerchantCommerceJson<MerchantDetailsResponse>(
      `/merchants/${merchantId}`,
    );
    return details.logoUrl ?? undefined;
  } catch {
    return undefined;
  }
}

export async function fetchNearbyMerchants(
  query: NearbyMerchantQuery,
): Promise<NearbyMerchant[]> {
  const search = new URLSearchParams({
    lat: String(query.latitude),
    lng: String(query.longitude),
  });
  if (query.radiusMeters != null) {
    search.set('radiusMeters', String(query.radiusMeters));
  }
  const response = await fetchMerchantCommerceJson<NearbyMerchantResponse>(
    `/merchants/nearby?${search.toString()}`,
  );
  const merchants = (response.merchants ?? [])
    .map(mapNearbyMerchant)
    .filter((merchant): merchant is NearbyMerchant => merchant != null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const logos = await Promise.allSettled(
    merchants.map((m) => fetchMerchantLogoUrl(m.merchantId)),
  );

  return merchants.map((merchant, i) => ({
    ...merchant,
    logoUrl: logos[i]?.status === 'fulfilled' ? logos[i].value : undefined,
  }));
}

export async function fetchGeofenceRegions(position?: {
  latitude: number;
  longitude: number;
}): Promise<GeofenceRegion[]> {
  const search = new URLSearchParams();
  if (position) {
    search.set('lat', String(position.latitude));
    search.set('lng', String(position.longitude));
  }
  const query = search.toString();
  const response = await fetchMerchantCommerceJson<GeofenceRegionsResponse>(
    `/geofence/regions${query ? `?${query}` : ''}`,
  );
  return (response.regions ?? [])
    .filter((region) => region?.regionId && region.displayName)
    .map((region) => ({
      regionId: region.regionId!,
      displayName: region.displayName!,
      latitude: ensureNumber(region.latitude),
      longitude: ensureNumber(region.longitude),
      radiusMeters: ensureNumber(region.radiusMeters),
      distanceMeters: ensureNumber(region.distanceMeters, Number.NaN),
    }));
}

export async function markNearbyMerchantRefreshNeeded(): Promise<void> {
  await storage.setItem(REFRESH_MARKER_KEY, String(Date.now()));
}

export async function readNearbyMerchantRefreshMarker(): Promise<string | null> {
  return storage.getItem(REFRESH_MARKER_KEY);
}
