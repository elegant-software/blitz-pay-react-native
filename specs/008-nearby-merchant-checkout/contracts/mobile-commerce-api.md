# Contract: Mobile Commerce API Integration

## Purpose

Define the backend-facing contract the mobile client relies on for nearby merchant discovery, branch resolution, product browsing, and checkout handoff for the nearby merchant purchase flow.

## Nearby Merchant Discovery

### Request

- **Method**: `GET`
- **Path**: `/{version}/merchants/nearby`
- **Required Inputs**:
  - `lat`
  - `lng`
- **Optional Inputs**:
  - `radiusMeters`

### Response Contract

- Returns a merchant collection.
- Each merchant entry must include:
  - `merchantId`
  - `legalBusinessName`
  - `latitude`
  - `longitude`
  - `distanceMeters`
  - `geofenceRadiusMeters`
- The mobile client maps `legalBusinessName` to the user-facing merchant name.

### Client Expectations

- Results are ordered by proximity.
- Empty responses are valid and must drive an empty-state UI rather than an error state.
- Nearby merchant entries become the source of truth for landing cards and merchant selection.

## Optional Geofence Region Refresh Context

### Request

- **Method**: `GET`
- **Path**: `/{version}/geofence/regions`
- **Optional Inputs**:
  - `lat`
  - `lng`

### Response Contract

- Returns active regions with:
  - `regionId`
  - `displayName`
  - `latitude`
  - `longitude`
  - `radiusMeters`
  - `distanceMeters`

### Client Expectations

- Geofence regions are used to align local monitored regions with backend-managed regions and to support refresh timing.
- Merchant discovery UI does not render directly from this response.

## Merchant Branch Resolution

### Request

- **Method**: `GET`
- **Path**: `/{version}/merchants/{merchantId}/branches`

### Response Contract

- Returns active branches for the merchant.
- Each branch must provide a stable `branchId` and enough descriptive/location data for the client to resolve one active shopping branch.

### Client Expectations

- The client resolves one branch per merchant session before requesting products.
- If no active branch is available, product browsing and checkout remain unavailable for that merchant.

## Active Product Catalog

### Request

- **Method**: `GET`
- **Path**: `/{version}/merchants/{merchantId}/products`
- **Required Inputs**:
  - `branchId`

### Response Contract

- Returns active products for the selected merchant branch.
- Each product entry must include:
  - `productId`
  - `branchId`
  - `name`
  - `unitPrice`
  - `active`
- Optional descriptive fields such as `description` and `imageUrl` may be rendered when present.

### Client Expectations

- Only active products can be shown as purchasable.
- An empty product list is valid and must produce a non-purchasable empty state.

## Checkout Handoff

### Client-Owned Checkout Context

- The mobile client owns:
  - selected products
  - per-product quantity
  - computed basket subtotal
  - merchant and branch context

### Payment Flow Expectations

- Existing payment flows continue to accept an aggregated amount for payment initiation.
- The mobile client passes:
  - merchant context
  - branch context
  - aggregated total
  - user-facing basket summary

### Known Contract Gap

- The provided backend payment contract does not yet describe a multi-line-item order payload for checkout.
- For this feature, line-item selection remains a mobile checkout concern, while payment initiation uses the validated aggregated amount and merchant context.
- A future backend order contract can extend this flow without changing the user-facing basket behavior.
