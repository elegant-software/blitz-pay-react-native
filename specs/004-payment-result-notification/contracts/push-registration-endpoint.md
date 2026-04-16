# Contract: Device Push Registration Endpoint

**Endpoint**: `POST /v1/devices/push-token`
**Owner**: Backend team
**Consumer (this feature)**: Mobile app — `pushRegistration.ts`

## Purpose

Tell the backend which Expo push token belongs to the currently authenticated user on this device, so the backend can send result notifications for that user's payments.

## When the client calls it

1. Immediately after successful sign-in (Keycloak auth success callback).
2. When push permission transitions from "denied" to "granted" mid-session.
3. When Expo issues a rotated token (detected via `Notifications.addPushTokenListener`).

The client caches the last-registered token in secure-store (`blitzpay_push_token`) and skips the POST if the token is unchanged.

## Request

```
POST /v1/devices/push-token HTTP/1.1
Host: <backend-host>
Authorization: Bearer <keycloak-access-token>
Content-Type: application/json
```

```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `expoPushToken` | string | yes | Full Expo token including the `ExponentPushToken[...]` wrapper. |
| `platform` | enum | yes | `ios \| android`. |

User is inferred by the backend from the bearer token (`sub` claim).

## Response — 204 No Content

Registration succeeded / was already up to date.

## Response — 4xx

- `400` — malformed token. Client logs, does not retry.
- `401` — refresh and retry once.

## Response — 5xx / network

Transient. Client retries with capped exponential backoff (up to 3 attempts) then gives up for this session; will retry on next app launch.

## Non-goals

- This endpoint does not list or query registrations; it is write-only for the client.
- Token invalidation (marking `active: false`) is handled server-side based on Expo's responses and is not exposed here.
