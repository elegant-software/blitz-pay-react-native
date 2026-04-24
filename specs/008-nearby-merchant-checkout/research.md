# Research: Nearby Merchant Checkout

## Decision 1: Use nearby merchant search as the canonical landing data source

- **Decision**: Populate the landing merchant list from nearby merchant search results using the user’s latest location, and treat geofence events as refresh triggers rather than as the primary merchant data source.
- **Rationale**: The backend provides a dedicated nearby merchant search response with merchant identity, name, distance, and location metadata. The geofence/proximity flow is useful for context refresh and event recording, but it does not return the richer merchant list required for the landing screen.
- **Alternatives considered**:
  - Use local geofence region definitions as the landing data source: rejected because local region IDs can diverge from backend-managed merchant regions and do not provide the full merchant card data needed by the UI.
  - Keep mocked landing merchants and only refresh detail screens from the backend: rejected because it fails the feature goal of removing placeholder merchant content from discovery.

## Decision 2: Resolve merchant context from location first, geofence second

- **Decision**: Use the current device location to fetch nearby merchants on landing load and on explicit refresh, while geofence enter events trigger a refresh of the nearby merchant list when the app is active again.
- **Rationale**: Location-based discovery is the most reliable way to recover from unrecognized or stale geofence region IDs and ensures the user still sees nearby merchants even if the backend ignores a specific local region identifier.
- **Alternatives considered**:
  - Depend on geofence enter events only: rejected because users could miss live merchant discovery if the event does not fire, the app starts inside a region, or the region ID is not recognized by the backend.
  - Ignore geofence entirely: rejected because the feature is explicitly location- and geofence-driven, and geofence events remain valuable for proximity recording and merchant refresh timing.

## Decision 3: Resolve a single active shopping branch per merchant session

- **Decision**: For a selected merchant, fetch that merchant’s active branches and resolve one shopping branch for the session using this order: branch indicated by backend merchant context if present, otherwise the nearest active branch to the user’s current location, otherwise the only available active branch.
- **Rationale**: Product listing is branch-scoped, so the mobile client needs a deterministic branch before it can request products. Resolving one branch per merchant session keeps the flow simple and avoids adding a branch selector unless real data proves it is necessary.
- **Alternatives considered**:
  - Add a mandatory branch picker before showing products: rejected because it adds friction to the primary purchase path and the current feature does not require multi-branch browsing as a user-facing step.
  - Use a hardcoded or first-returned branch: rejected because branch ordering is not guaranteed to represent the user’s actual nearest or most relevant branch.

## Decision 4: Use live active products and client-owned basket state

- **Decision**: Fetch active products for the resolved merchant branch and maintain basket contents, quantities, and computed totals in client-owned feature state for the current merchant session.
- **Rationale**: The backend exposes active product listing but does not expose a dedicated basket or order-building API in the provided contract. A client-owned basket fits the current app architecture and allows quantity editing without inventing unsupported backend endpoints.
- **Alternatives considered**:
  - Persist basket state on the backend immediately after each quantity change: rejected because the current API contract does not describe such an endpoint.
  - Reuse the current single-amount checkout screen without product selection state: rejected because it does not satisfy the multi-product purchase requirement.

## Decision 5: Map multi-product purchase to existing amount-driven checkout

- **Decision**: Pass the aggregated basket total, merchant ID, resolved branch ID, and a checkout summary into the existing payment flows while treating line-item details as checkout context owned by the mobile client for this feature.
- **Rationale**: The current payment integrations are amount-driven, and the provided payment request contract does not define a clear multi-line-item order payload. Using the basket total preserves the existing payment architecture and allows the user to pay for the selected products now, while leaving detailed server-side order capture as a later backend enhancement.
- **Alternatives considered**:
  - Block the feature until a backend order API exists: rejected because the current user request is to deliver the browsing and payment experience against the existing backend contract.
  - Force a single selected product through checkout: rejected because it does not satisfy the requirement for multiple products with counts.

## Decision 6: Introduce feature-based MVVM modules incrementally

- **Decision**: Add new nearby-merchant, merchant-catalog, and basket modules under `mobile/src/features/` and make the existing screens consume those modules as views.
- **Rationale**: The constitution requires feature-based MVVM for new React Native work, but the current app still has many flat `screens/`, `hooks/`, and `services/` directories. An incremental feature module approach satisfies the constitution without requiring a full app-wide migration.
- **Alternatives considered**:
  - Keep adding logic directly inside existing screens: rejected because it violates the constitution and would deepen the existing coupling between view code and data-fetching logic.
  - Fully migrate the whole mobile app to feature folders in this feature: rejected because it adds large unrelated scope and would slow delivery of the merchant checkout workflow.

## Decision 7: Treat stale product data as a checkout validation concern

- **Decision**: Revalidate product availability and price at the point the user proceeds from basket review to payment initiation, and stop checkout with a refresh message if data changed.
- **Rationale**: The feature requires the user to avoid paying stale totals. Revalidation at checkout start gives the smallest reliable window for catching deactivated products or price changes without adding excessive background polling.
- **Alternatives considered**:
  - Trust the basket snapshot until payment completes: rejected because it would allow stale totals and unavailable products to proceed.
  - Refresh the entire product list on every quantity tap: rejected because it would add latency and unnecessary backend load to the selection experience.
