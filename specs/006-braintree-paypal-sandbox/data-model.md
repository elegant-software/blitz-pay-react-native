# Data Model: Geofencing & Proximity Triggers

**Feature**: Geofencing — BlitzPay mobile  
**Date**: 2026-04-19

---

## Entities

### GeofenceRegion
Represents a registered merchant area monitored by the OS geofencing API.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | string | Unique region identifier, e.g., `merchant_123` | Required; max 64 chars (iOS limit) |
| merchantId | string | BlitzPay merchant identifier | Required |
| merchantName | string | Display name for notifications | Required |
| latitude | number | WGS-84 decimal degrees | Required; −90 to 90 |
| longitude | number | WGS-84 decimal degrees | Required; −180 to 180 |
| radius | number | Geofence radius in metres | Required; min 100 (iOS); max 1000 for prototype |
| notifyOnEnter | boolean | Fire task on enter | Required; `true` for this feature |
| notifyOnExit | boolean | Fire task on exit | Optional; `false` default |
| enabled | boolean | Whether region is active | Required |

**iOS constraint**: Max 20 regions per app. Sliding-window: monitor 20 nearest by Haversine distance from last known location.

---

### ProximityEvent
In-memory and transient — not persisted beyond the deduplication cooldown window.

| Field | Type | Description |
|-------|------|-------------|
| regionId | string | FK → GeofenceRegion.id |
| merchantId | string | FK → GeofenceRegion.merchantId |
| eventType | `'enter' \| 'exit'` | Geofence crossing direction |
| triggeredAt | string (ISO 8601) | UTC timestamp of OS callback |
| location | `{ latitude, longitude, accuracy? }` | Location at trigger time (from task data) |
| reported | boolean | Whether this event has been POSTed to the proximity API |

**Deduplication key**: `regionId + eventType` within a 10-minute sliding window, stored in `expo-secure-store` as JSON under key `geofence_cooldown`.

---

### GeofenceConfig
User-controlled settings, persisted in `expo-secure-store` under key `geofence_config`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| geofencingEnabled | boolean | `false` | Master switch — OS geofencing active |
| pollingEnabled | boolean | `false` | Polling fallback active |
| pollingIntervalMs | number | `60000` | Poll interval (min 30 000) |
| backgroundPermissionGranted | boolean | `false` | Cached result of `requestBackgroundPermissionsAsync` |

---

## State Transitions

### GeofenceMonitoring lifecycle

```
idle
  → [user enables geofencing + permission granted]
monitoring
  → [OS fires ENTER event]
triggered
  → [ProximityEvent reported to API]
cooldown (10 min)
  → [cooldown expires]
monitoring
```

```
monitoring
  → [user disables OR permission revoked]
idle
```

---

## TypeScript Interfaces

```typescript
// mobile/src/types/geofence.ts

export interface GeofenceRegion {
  id: string;
  merchantId: string;
  merchantName: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  enabled: boolean;
}

export interface ProximityEvent {
  regionId: string;
  merchantId: string;
  eventType: 'enter' | 'exit';
  triggeredAt: string;
  location: { latitude: number; longitude: number; accuracy?: number };
  reported: boolean;
}

export interface GeofenceConfig {
  geofencingEnabled: boolean;
  pollingEnabled: boolean;
  pollingIntervalMs: number;
  backgroundPermissionGranted: boolean;
}

// Payload sent to backend proximity API
export interface ProximityReportPayload {
  userId: string;
  merchantId: string;
  event: 'enter' | 'exit';
  location: { latitude: number; longitude: number };
  timestamp: string;
}

// Response from backend proximity API — location reporting only, no payment coupling
export interface ProximityReportResponse {
  recorded: boolean;
  action: 'notify' | 'none';
}
```