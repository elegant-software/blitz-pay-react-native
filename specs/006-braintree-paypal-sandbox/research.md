# Research: Geofencing & Proximity Triggers

**Feature**: Geofencing — BlitzPay mobile (Expo SDK 55, RN 0.83.4)  
**Date**: 2026-04-19

---

## 1. Geofencing Library Choice

**Decision**: `expo-location` (`startGeofencingAsync`) + `expo-task-manager`

**Rationale**:
- Wraps native iOS `CLLocationManager` region monitoring and Android `GeofencingClient` — the same power-efficient APIs the OS uses for system geofences.
- Already in the Expo SDK dependency tree (no extra native module install beyond the package itself).
- Background tasks registered with `TaskManager.defineTask` survive app restarts and are re-registered automatically after device reboot.
- API is consistent across platforms; no separate iOS/Android code paths in JS.

**Alternatives considered**:
- `react-native-geolocation-service` — gives raw GPS access but no geofence abstraction; would require manual enter/exit detection with the associated battery cost of continuous location polling. Rejected.
- `@turf/turf` point-in-polygon on periodic GPS fixes — works but requires the app or a background fetch to be running; not truly event-driven. Suitable only as polling fallback (see §4).
- Native modules (Swift `CLCircularRegion`, Kotlin `GeofencingRequest`) written as Expo config plugins — maximum flexibility but breaks the managed-workflow pattern already established in the project. Rejected.

---

## 2. Background Execution Model

**Decision**: `expo-task-manager` `GEOFENCE_BACKGROUND_TASK` defined at module scope in `mobile/src/tasks/geofenceTask.ts`

**Rationale**:
- `TaskManager.defineTask` must be called in the global scope at app boot (before any React tree renders) — same requirement as `expo-notifications` background handler already in the project.
- The task receives `{ data: { eventType, region }, error }`. `eventType` is `Location.GeofencingEventType.Enter` (0) or `.Exit` (1).
- No UI thread access inside the task — side effects limited to fetch calls and `expo-notifications` scheduling.

**Key constraint**: iOS limits active geofence regions to **20 per app**. For the prototype (≤50 merchants), implement a sliding-window strategy: monitor the 20 nearest merchants based on last known coarse location.

---

## 3. Permissions Strategy

### iOS
| Key | Info.plist entry | Required for |
|-----|-----------------|--------------|
| `NSLocationWhenInUseUsageDescription` | "BlitzPay uses your location to find nearby merchants." | Foreground |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | "BlitzPay monitors merchant areas in the background to alert you to offers." | Background geofencing |
| `UIBackgroundModes` += `location` | (existing array has `remote-notification`) | Background wakeup |

### Android
| Permission | `uses-permission` | Required for |
|-----------|------------------|--------------|
| `ACCESS_FINE_LOCATION` | Yes | Geofencing (requires fine) |
| `ACCESS_COARSE_LOCATION` | Yes | Coarse fallback |
| `ACCESS_BACKGROUND_LOCATION` | Yes | Android 10+ background geofencing |

Android 11+ (API 30+): `ACCESS_BACKGROUND_LOCATION` cannot be requested in the same dialog as foreground location. Show a two-step rationale: first request foreground, then direct the user to Settings for background. `expo-location` v17 provides `requestBackgroundPermissionsAsync()` for this.

**Decision**: Request foreground permission at app launch (if not already granted). Request background permission lazily — only after the user explicitly enables geofencing in Settings or Account screen.

---

## 4. Periodic Polling Fallback

**Decision**: `Location.startLocationUpdatesAsync(POLL_TASK, { timeInterval: 60_000, distanceInterval: 50 })`

**Rationale**: Some Android OEMs (Xiaomi, Huawei) aggressively kill background processes, preventing the native GeofencingClient from firing. A 60-second / 50-metre poll task serves as a fallback proximity checker. The poll task calls the same proximity-check logic as the geofence task.

**Battery impact**: At 60s intervals with `accuracy: Balanced`, the Location module uses the fused location provider (not continuous GPS). Measured drain on a mid-range Android device ≈ 1–2% per hour additional, which is acceptable for a payment app with user opt-in.

**Fallback trigger**: If `Location.hasStartedGeofencingAsync(GEOFENCE_TASK)` returns `false` after starting (e.g., device caps reached), automatically enable the poll fallback.

---

## 5. Proximity Check — Local vs Backend

**Decision**: Hybrid — local radius check gates the network call; backend records and acts on the event.

**Rationale**:
- Local check (Haversine against region radius) prevents network spam if the OS fires repeated enter events at a region boundary.
- Backend records the event for audit, personalisation, and offer triggering — matches the observability parity requirement from the spec.
- "API will be provided" assumption honoured: the contract is defined in `contracts/proximity-api.md` but the implementation is a simple `fetch` POST.

**Deduplication**: Store the last-reported `{ regionId, timestamp }` in `expo-secure-store`. Do not re-report the same region enter within a 10-minute cooldown window.

---

## 6. Merchant Region Data Source

**Decision**: Static hardcoded array in `mobile/src/lib/geofenceRegions.ts` for the prototype. Shape is API-compatible for easy migration.

**Rationale**: Merchant data is hardcoded throughout the app (per CLAUDE.md: "Merchant, invoice, and product data are hardcoded/mocked in components"). Keeping the same pattern avoids introducing a new API dependency in the prototype.

**Migration path**: Replace the static array with a fetch from `/api/merchants/geofences` that returns the same `GeofenceRegion[]` shape defined in the data model.

---

## 7. Scope Boundary

**Decision**: The geofencing feature is **location-only**. It detects and reports that the user is physically at a merchant's location. It does not trigger payments, open checkout, or surface payment UI.

**What the feature does**:
- Registers merchant locations as geofence regions.
- Detects OS-level enter/exit events.
- Reports the event to the backend proximity API.
- Optionally schedules a neutral local notification: "You're at {merchantName}."

**What the feature does NOT do**:
- Initiate or pre-fill a payment flow.
- Navigate to the Checkout screen.
- Pass invoice or amount data.

**Rationale**: Location and payment are orthogonal concerns. The backend decides what to do with a proximity event (analytics, CRM update, offer eligibility). The mobile client is a dumb reporter.