import type { GeofenceRegion } from '../types/geofence';

export const MERCHANT_REGIONS: GeofenceRegion[] = [
  {
    id: 'merchant_001',
    merchantId: 'merchant_001',
    merchantName: 'Coffee Corner',
    latitude: 48.8566,
    longitude: 2.3522,
    radius: 150,
    notifyOnEnter: true,
    notifyOnExit: false,
    enabled: true,
  },
];
