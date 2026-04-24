# Feature Specification: Nearby Merchant Checkout

**Feature Branch**: `[008-nearby-merchant-checkout]`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Look at /Users/mehdi/MyProject/blitz-pay/api-docs/api-doc.yml I need to you to call back-end API to show nearby merchants based on geofencing and merchants info should not be mock data any more on landing screen secondly when I choose marchnats using back-end api show active products, user should be able to choose the product (multiple prodcut) with count and pay"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Nearby Merchants (Priority: P1)

As a mobile user, I want the landing screen to show nearby merchants based on my current location and active geofence context so I can immediately see real merchants near me instead of placeholder content.

**Why this priority**: This replaces the current mocked landing experience with real merchant discovery, which is the entry point for the rest of the commerce journey.

**Independent Test**: Can be fully tested by opening the landing screen with location access enabled and verifying that the merchant list is populated from live nearby merchant data rather than hardcoded entries.

**Acceptance Scenarios**:

1. **Given** the user has granted location access and nearby merchants exist, **When** the landing screen loads, **Then** the screen shows nearby merchants ordered by proximity using live merchant information.
2. **Given** the user is inside or near a recognized geofence region, **When** the app refreshes nearby merchants, **Then** the merchant list reflects the user’s current location context and does not display placeholder merchant cards.
3. **Given** no nearby merchants are returned, **When** the landing screen loads, **Then** the user sees a clear empty state explaining that no nearby merchants are currently available.

---

### User Story 2 - Browse Active Merchant Products (Priority: P2)

As a mobile user, I want to open a merchant and see the merchant’s active products from the backend so I can review what is currently available before starting checkout.

**Why this priority**: Merchant discovery only becomes actionable if the user can inspect the merchant’s real catalog and select items to buy.

**Independent Test**: Can be fully tested by selecting a merchant from the landing screen and confirming that the merchant detail view loads active products from the backend rather than mock product content.

**Acceptance Scenarios**:

1. **Given** a merchant with at least one active product, **When** the user opens that merchant, **Then** the merchant detail screen shows the active products for that merchant’s current shopping branch.
2. **Given** a merchant has no active products, **When** the user opens that merchant, **Then** the screen communicates that no products are currently available and prevents a misleading purchase action.
3. **Given** product data changes between visits, **When** the user reopens the merchant, **Then** the screen reflects the latest active product data from the backend instead of cached placeholder content.

---

### User Story 3 - Build a Basket and Pay (Priority: P3)

As a mobile user, I want to select multiple products, adjust quantities, and pay the combined total so I can complete a merchant purchase in one checkout flow.

**Why this priority**: Multi-item selection and quantity control are required to turn merchant browsing into a usable purchase journey.

**Independent Test**: Can be fully tested by selecting multiple active products with quantities, reviewing the computed basket total, and proceeding into payment with the correct total and merchant context.

**Acceptance Scenarios**:

1. **Given** a merchant product list is visible, **When** the user adds multiple products and changes their counts, **Then** the basket updates each line item and recalculates the total immediately.
2. **Given** the user has at least one selected product, **When** the user proceeds to pay, **Then** checkout uses the selected merchant context and the summed total of all chosen items.
3. **Given** a previously selected product is no longer available or no longer active, **When** the user attempts to proceed to pay, **Then** the user is informed that the basket must be refreshed before payment continues.

### Edge Cases

- What happens when the user denies location access after previously using nearby merchant discovery?
- How does the system handle a geofence region that is recognized locally but does not map to any current nearby merchant result?
- What happens when the backend returns merchants but the merchant’s active product list is empty?
- How does the system handle a merchant with multiple active branches where the current shopping branch changes between product selection and checkout?
- What happens when the basket contains quantities greater than one and the user reduces an item count to zero?
- How does the system handle a product price change between basket creation and payment initiation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing screen MUST populate nearby merchant content from live merchant data and MUST NOT display hardcoded merchant placeholders once live data is available.
- **FR-002**: The system MUST determine nearby merchants using the user’s latest available location context and refresh the landing list when location context changes materially.
- **FR-003**: The nearby merchant list MUST show, at minimum, each merchant’s name, distance, and location-derived ordering when that information is available.
- **FR-004**: The system MUST provide a clear empty state when no nearby merchants are available and MUST prevent users from mistaking the empty state for a loading failure.
- **FR-005**: Selecting a merchant from the landing screen MUST open a merchant detail experience using that merchant’s live backend identity rather than locally mocked content.
- **FR-006**: The merchant detail experience MUST display only active products for the merchant’s current shopping branch.
- **FR-007**: Each product entry MUST display enough information for selection, including product name, unit price, and any available descriptive content needed to distinguish products.
- **FR-008**: The user MUST be able to add more than one distinct product from a merchant into a basket during the same shopping session.
- **FR-009**: The user MUST be able to increase or decrease the quantity for each selected product before payment.
- **FR-010**: Reducing a selected product quantity to zero MUST remove that product from the current basket.
- **FR-011**: The system MUST continuously show the current basket total based on selected products and their quantities before the user starts payment.
- **FR-012**: The system MUST block checkout until at least one active product with a positive quantity is selected.
- **FR-013**: When the user starts payment, the checkout flow MUST use the selected merchant context and the current basket total from the selected products.
- **FR-014**: If product availability or price changes before payment begins, the system MUST stop checkout, refresh the affected items, and clearly explain that the basket changed.
- **FR-015**: If location access is unavailable, the landing experience MUST provide a fallback explanation and allow the user to retry location-based merchant discovery after permissions are restored.
- **FR-016**: The system MUST preserve enough merchant and basket context during checkout so the user can understand which merchant they are paying and what total is being charged.

### Key Entities *(include if feature involves data)*

- **Nearby Merchant**: A merchant returned for the user’s current location context, including merchant identity, display name, distance, and location metadata relevant to ranking and presentation.
- **Geofence Region**: A location-based region associated with a merchant context that can be used to refresh or validate nearby merchant discovery when the user enters or exits a monitored area.
- **Shopping Branch Context**: The active merchant branch used for product selection, pricing, and product availability during a shopping session.
- **Active Product**: A merchant product currently available for purchase, including identity, name, unit price, descriptive content, and active status.
- **Basket Item**: A selected product plus its chosen quantity and calculated line total within the user’s current shopping session.
- **Basket**: The set of currently selected products for one merchant checkout, including merchant context, selected items, quantities, and computed total.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of landing-screen merchant cards shown after live data loads are sourced from current nearby merchant data rather than placeholder merchant content.
- **SC-002**: In user testing, at least 90% of users can identify and open a nearby merchant from the landing screen within 30 seconds of app launch when location permission is already granted.
- **SC-003**: At least 90% of users can add multiple products with quantities and reach the payment step on their first attempt without assistance.
- **SC-004**: When nearby merchants exist, the first visible merchant list contains only merchants relevant to the user’s current location context and is ordered consistently by proximity.
- **SC-005**: When a selected product becomes unavailable before payment, 100% of affected checkout attempts are interrupted with a clear basket refresh message instead of proceeding with stale totals.

## Assumptions

- The mobile experience continues to reuse the existing authenticated payment flow and payment methods that are already available in the app.
- Nearby merchant discovery is limited to merchants returned for the user’s current location context and does not require free-text search in this feature.
- The shopping session supports one merchant at a time; users do not mix products from different merchants in a single payment.
- When a merchant has multiple active branches, the shopping experience uses the branch selected by the backend’s current merchant context or nearest applicable branch for the session.
- Merchant images, ratings, and promotional event cards are secondary to the core live merchant discovery and purchase flow and may be omitted when not provided by the backend.
