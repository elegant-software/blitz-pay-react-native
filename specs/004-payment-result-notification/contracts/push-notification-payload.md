# Contract: Payment Result Push Notification Payload

**Channel**: Expo Push Service → `expo-notifications` listeners in mobile app
**Owner (sender)**: Backend team (calls Expo Push API on payment finalize)
**Owner (receiver)**: Mobile app — `pushHandlers.ts`

## Purpose

Deliver the terminal result of a payment to the paying user's device within seconds of finalization, so the app can transition from "processing" to the result screen without a network round-trip.

## Expo push message shape (backend → Expo)

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Payment successful",
  "body": "€12.99 to Acme GmbH",
  "sound": "default",
  "priority": "high",
  "channelId": "payments",
  "data": {
    "type": "payment_result",
    "paymentRequestId": "f9a1c0de-1234-4abc-9def-0123456789ab",
    "status": "succeeded",
    "reason": null
  }
}
```

### `data` payload — required fields consumed by the app

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | yes | MUST equal `"payment_result"`. Other values are ignored by this feature's handler. |
| `paymentRequestId` | string (UUID) | yes | Routes the signal to the correct tracker / result screen. |
| `status` | enum | yes | One of `succeeded \| failed \| cancelled`. Non-terminal statuses MUST NOT be sent as result pushes. |
| `reason` | string \| null | no | Present on `failed` / `cancelled`; max 200 chars. |

### `title` / `body` — user-visible text

Required so the OS shows a visible notification when the app is backgrounded or killed. Localized by the backend based on user profile language (DE/EN) — the app does not re-translate.

### Channel / priority

- **iOS**: `priority: "high"` + `sound: "default"` so the notification surfaces promptly.
- **Android**: `channelId: "payments"` — the app creates this channel with `IMPORTANCE_HIGH` at first launch.

## App-side handling

### Foreground

`Notifications.addNotificationReceivedListener` → if `data.type === "payment_result"`, dispatch to `paymentResultTracker.applyPush(data)`. Tracker de-dups against any poll result already landed.

### Background / killed

OS shows the notification. On tap:

`Notifications.addNotificationResponseReceivedListener` → read `data.paymentRequestId` → navigate via React Navigation `linking` to `blitzpay://payments/{paymentRequestId}/result`.

On cold start via notification tap, `Notifications.getLastNotificationResponseAsync()` is consulted in the app bootstrap to perform the same navigation.

## De-duplication rules

- If `paymentResultTracker` has already resolved the same `paymentRequestId` (via an earlier push or a polling response), additional pushes are dropped with a debug log and `payment_result_duplicate_suppressed` analytics event.
- Duplicate pushes MUST NOT cause a second navigation or a second analytics `payment_result_*` event.

## Security / privacy

- No PII beyond amount and merchant name in `title`/`body`. No account numbers, no card data.
- `reason` is a short, user-safe string — never include stack traces, bank error codes, or internal ids.
- The push token is treated as sensitive-equivalent and is sent to backend over TLS only.

## Failure modes the payload contract guards against

- Backend sends a payment_result push with a non-terminal status → app ignores (validation rule in data-model).
- Backend sends a push without `paymentRequestId` → app ignores and logs.
- Backend sends duplicate pushes for the same terminal transition → app de-dups (see above).
