# API Contract: Proximity Reporting

**Feature**: Geofencing & Proximity Triggers  
**Date**: 2026-04-19  
**Owner**: BlitzPay backend  
**Status**: Draft — endpoint to be implemented; assumed provided per feature spec

---

## Overview

The mobile app POSTs a proximity event to the backend whenever the geofence background task fires an `enter` event that passes the local deduplication check. The purpose is **purely to report that the user is physically at a merchant's location** — no payment logic is involved. The backend decides what to do with that signal (analytics, CRM update, eligibility checks). The client is a dumb reporter.

---

## Endpoint

### `POST /api/proximity`

#### Request

**Headers**
```
Content-Type: application/json
Authorization: Bearer <keycloak_access_token>
```

**Body**
```json
{
  "userId": "string",           // Keycloak subject claim (sub)
  "merchantId": "string",       // BlitzPay merchant ID
  "event": "enter | exit",      // Geofence crossing direction
  "location": {
    "latitude": 48.8566,        // WGS-84 decimal degrees
    "longitude": 2.3522
  },
  "timestamp": "2026-04-19T12:00:00.000Z"  // ISO 8601 UTC
}
```

**Validation rules**
- `userId`: required, non-empty
- `merchantId`: required, must match a known merchant (backend validates)
- `event`: required, `"enter"` or `"exit"`
- `location.latitude`: required, −90 to 90
- `location.longitude`: required, −180 to 180
- `timestamp`: required, valid ISO 8601; must be within ±5 minutes of server time (replay protection)

---

#### Response — 200 OK

```json
{
  "recorded": true,
  "action": "notify | none"
}
```

**Action semantics**

| `action` | Client behaviour |
|----------|-----------------|
| `notify` | Schedule a neutral local notification: "You're at {merchantName}." No navigation, no payment UI. |
| `none` | Silently acknowledge; no user-visible action |

The client **never** navigates to a payment screen as a result of a proximity event.

---

#### Response — 400 Bad Request

```json
{ "error": "invalid_payload", "message": "timestamp too old" }
```

---

#### Response — 401 Unauthorized

```json
{ "error": "unauthorized" }
```
Token expired or missing. Client should refresh token (standard Keycloak ROPC refresh) and retry once.

---

#### Response — 429 Too Many Requests

```json
{ "error": "rate_limited", "retryAfterSeconds": 600 }
```
Server-side cooldown gate — 10 minutes per `(userId, merchantId, event)` tuple. Client also enforces the same cooldown locally via `expo-secure-store` to avoid reaching this in the first place.

---

## Prototype Stub

Until the real backend endpoint is implemented, the geofence task should call a local stub:

```typescript
// mobile/src/services/geofence.ts
async function reportProximity(payload: ProximityReportPayload): Promise<ProximityReportResponse> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    // Stub for development without a running backend
    return { action: 'notify' };
  }
  const resp = await fetch(`${apiUrl}/api/proximity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getStoredToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`proximity_api_error: ${resp.status}`);
  return resp.json() as Promise<ProximityReportResponse>;
}
```

---

## Merchant Geofences Endpoint (future)

When the backend provides merchant geofence data, replace the static `geofenceRegions.ts` with:

### `GET /api/merchants/geofences`

**Response — 200 OK**
```json
[
  {
    "id": "merchant_001",
    "merchantId": "merchant_001",
    "merchantName": "Coffee Corner",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "radius": 150,
    "notifyOnEnter": true,
    "notifyOnExit": false,
    "enabled": true
  }
]
```

The response shape matches `GeofenceRegion[]` from `data-model.md` exactly — no client-side transformation needed.
