# Contract: Payment Status Endpoint

**Endpoint**: `GET /v1/payments/{paymentRequestId}`
**Owner**: Backend team
**Consumer (this feature)**: Mobile app — polling fallback in `paymentStatusClient.ts`

## Purpose

Authoritative read of the current status of a single payment. The mobile app calls this when a push notification has not arrived within the initial wait window, and again on app launch to resolve in-flight payments persisted from a prior session.

## Request

```
GET /v1/payments/{paymentRequestId} HTTP/1.1
Host: <backend-host>
Authorization: Bearer <keycloak-access-token>
Accept: application/json
```

**Path params**:

| Name | Type | Notes |
|------|------|-------|
| `paymentRequestId` | string (UUID) | Required. Must match the id returned at payment-create. |

**Query params**: none.

**Auth**: Keycloak bearer token from the mobile app's existing session (`blitzpay_session` → access token). 401 → app refreshes token and retries once; second 401 → surface generic error, stop polling this payment.

## Response — 200 OK

```json
{
  "paymentRequestId": "f9a1c0de-1234-4abc-9def-0123456789ab",
  "status": "processing",
  "amount": 1299,
  "currency": "EUR",
  "reason": null,
  "updatedAt": "2026-04-15T09:41:02.173Z"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `paymentRequestId` | string | yes | Echoes the path param. |
| `status` | enum | yes | `pending \| processing \| succeeded \| failed \| cancelled`. Client treats any other value as non-terminal. |
| `amount` | integer | yes | Minor units (cents). |
| `currency` | string | yes | ISO 4217, 3 chars. |
| `reason` | string \| null | no | Non-null only on `failed` / `cancelled`. Max 200 chars for display. |
| `updatedAt` | string | yes | ISO 8601 UTC. |

## Response — 404 Not Found

Payment request id does not exist (or belongs to another user). Client stops polling this id and surfaces a generic error.

## Response — 4xx (other)

`401` → refresh and retry once, then give up on this id.
`429` → respect `Retry-After` header if present; otherwise apply next backoff step.

## Response — 5xx / network error

Treat as transient. Do **not** surface as payment failure. Continue the backoff schedule until a terminal status or max wait.

## Client behavior summary

| Response | Client action |
|----------|---------------|
| 200, terminal status | Resolve tracker; stop polling; show result screen. |
| 200, non-terminal / unknown status | Schedule next poll per backoff; stay on processing UI. |
| 404 | Stop polling; show generic "payment not found" error. |
| 401 (first) | Refresh token, retry once. |
| 401 (after refresh) | Stop polling; surface auth error. |
| 429 | Honor `Retry-After`, else next backoff. |
| 5xx / network | Log, continue backoff. |

## Rate expectations

A single tracker issues at most ~6 calls in 60s (backoff 2s, 3s, 5s, 8s, 13s, 21s). The backend should handle up to N×6 calls per minute where N is concurrent in-flight payments — trivially small for the prototype user base.

## Non-goals

- This endpoint does **not** trigger any state change; it is purely read.
- This endpoint is **not** a long-poll; clients do their own polling with backoff.
