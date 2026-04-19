# Quickstart: Geofencing & Proximity Triggers

**Feature**: Geofencing — BlitzPay mobile  
**Date**: 2026-04-19

---

## 1. Install new dependencies

```bash
cd mobile
npx expo install expo-location expo-task-manager
```

`expo-location` bundles `expo-task-manager` as a peer, but installing both explicitly keeps version pinning explicit.

---

## 2. Configure `app.config.js`

Add location permissions and background mode:

```js
// mobile/app.config.js — ios.infoPlist additions
infoPlist: {
  // existing keys...
  NSLocationWhenInUseUsageDescription:
    "BlitzPay uses your location to find nearby merchants.",
  NSLocationAlwaysAndWhenInUseUsageDescription:
    "BlitzPay monitors merchant areas in the background to alert you to offers.",
  UIBackgroundModes: ["remote-notification", "location"], // add "location"
},

// android.permissions additions
permissions: [
  // existing...
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_BACKGROUND_LOCATION",
],
```

Add the `expo-location` plugin to the `plugins` array:

```js
["expo-location", {
  locationAlwaysAndWhenInUsePermission:
    "BlitzPay monitors merchant areas in the background to alert you to offers.",
}],
```

---

## 3. Register the background task (global scope)

In `mobile/src/tasks/geofenceTask.ts` (imported at the top of `App.tsx` / entry file, before any React component):

```typescript
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const GEOFENCE_TASK = 'BLITZPAY_GEOFENCE_TASK';

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };
  if (eventType === Location.GeofencingEventType.Enter) {
    // POST to proximity API to report user is at merchant location.
    // No payment logic here — backend decides what to do with the signal.
  }
});
```

---

## 4. Register geofence regions

In `mobile/src/services/geofence.ts`:

```typescript
import { MERCHANT_REGIONS } from '@/lib/geofenceRegions';

export async function startGeofencing(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('foreground_permission_denied');

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') throw new Error('background_permission_denied');

  const regions = MERCHANT_REGIONS.filter(r => r.enabled).slice(0, 20); // iOS max
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

export async function stopGeofencing(): Promise<void> {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}
```

---

## 5. Rebuild the native app

Geofencing requires a native build (not Expo Go):

```bash
cd mobile
npx expo prebuild --clean   # regenerate ios/ android/ with new permissions
npm run ios                 # or android
```

---

## 6. Simulate geofence events

### iOS Simulator
1. In Xcode: **Debug → Simulate Location → Custom Location**
2. Enter the lat/lng of a registered `GeofenceRegion` to trigger the task.

### Android Emulator
```bash
# Use the geo fix command in the emulator console
telnet localhost 5554
geo fix <longitude> <latitude>
```

Or use Android Studio's **Extended Controls → Location** panel.

---

## 7. Test proximity API (without device)

```bash
# Simulate what the background task posts
curl -X POST http://localhost:3001/api/proximity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-001",
    "merchantId": "merchant_001",
    "event": "enter",
    "location": { "latitude": 48.8566, "longitude": 2.3522 },
    "timestamp": "2026-04-19T12:00:00Z"
  }'
```

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Geofence never fires on iOS | Background location permission not "Always" | Check Settings → BlitzPay → Location → Always |
| Android task killed by OEM | Battery optimisation | Exempt app from battery optimisation in device settings |
| iOS: only 20 regions warning in logs | Too many merchants | Sliding-window reduction applies automatically |
| Task fires but no notification | Foreground notification permissions | Verify `expo-notifications` permission granted |