# Data Model: Nearby Merchant Checkout

## NearbyMerchant

- **Purpose**: Represents a merchant candidate for the landing discovery experience based on the user’s current location.
- **Fields**:
  - `merchantId`: unique merchant identifier
  - `displayName`: merchant name shown on cards
  - `latitude`: merchant latitude
  - `longitude`: merchant longitude
  - `distanceMeters`: computed distance from the user
  - `geofenceRadiusMeters`: merchant search or geofence radius metadata
  - `googlePlaceId`: optional place correlation value
- **Relationships**:
  - Has many `MerchantBranch`
  - Can be the owner of one active `Basket`
- **Validation Rules**:
  - `merchantId` must be present
  - `displayName` must be non-empty
  - `distanceMeters` must be zero or greater when supplied

## MerchantBranch

- **Purpose**: Represents an active branch that can supply products and fulfill checkout for a merchant session.
- **Fields**:
  - `branchId`: unique branch identifier
  - `merchantId`: owning merchant identifier
  - `name`: branch display name
  - `latitude`: optional branch latitude
  - `longitude`: optional branch longitude
  - `distanceMeters`: optional user-to-branch distance
  - `addressSummary`: optional user-facing location summary
- **Relationships**:
  - Belongs to one `NearbyMerchant`
  - Has many `ActiveProduct`
- **Validation Rules**:
  - `branchId` must be present
  - `merchantId` must match the current merchant session
  - Only active branches are eligible for product selection

## ActiveProduct

- **Purpose**: Represents a merchant product currently eligible for selection in the shopping session.
- **Fields**:
  - `productId`: unique product identifier
  - `branchId`: owning branch identifier
  - `name`: product display name
  - `description`: optional descriptive copy
  - `unitPrice`: monetary unit price
  - `imageUrl`: optional product image
  - `active`: active availability flag
  - `updatedAt`: last known update time
- **Relationships**:
  - Belongs to one `MerchantBranch`
  - Can appear in zero or one `BasketItem` per basket
- **Validation Rules**:
  - `productId`, `branchId`, `name`, and `unitPrice` must be present
  - `unitPrice` must be greater than zero
  - Only products marked active can be added to the basket

## BasketItem

- **Purpose**: Represents one selected product and quantity inside the current basket.
- **Fields**:
  - `productId`: selected product identifier
  - `productName`: product display name at the time of selection
  - `branchId`: owning branch identifier
  - `merchantId`: owning merchant identifier
  - `unitPrice`: unit price used for the current basket snapshot
  - `quantity`: selected quantity
  - `lineTotal`: derived monetary total for the item
- **Relationships**:
  - Belongs to one `Basket`
  - References one `ActiveProduct`
- **Validation Rules**:
  - `quantity` must be a positive integer
  - `lineTotal` must equal `unitPrice x quantity`
  - Setting `quantity` to zero removes the item from the basket

## Basket

- **Purpose**: Holds the single-merchant shopping selection that will be handed into checkout.
- **Fields**:
  - `merchantId`: owning merchant identifier
  - `merchantName`: owning merchant display name
  - `branchId`: resolved shopping branch identifier
  - `items`: list of basket items
  - `itemCount`: derived total count of units
  - `subtotal`: derived sum of line totals
  - `currency`: checkout currency for this session
  - `lastValidatedAt`: timestamp of the last product revalidation
- **Relationships**:
  - Belongs to one `NearbyMerchant`
  - Contains many `BasketItem`
  - Produces one `CheckoutContext`
- **Validation Rules**:
  - All items must belong to the same merchant and branch
  - Basket must contain at least one item before checkout can begin
  - `subtotal` must match the sum of current basket items

## CheckoutContext

- **Purpose**: Carries enough information from basket review into the existing checkout and payment flows.
- **Fields**:
  - `merchantId`: merchant identifier
  - `merchantName`: merchant display name
  - `branchId`: resolved branch identifier
  - `amount`: aggregated basket total
  - `currency`: currency presented to the user
  - `itemSummary`: human-readable summary of selected items
  - `basketSnapshot`: immutable view of the selected items at checkout start
- **Relationships**:
  - Derived from one `Basket`
  - Used by payment initiation and payment result tracking
- **Validation Rules**:
  - `amount` must equal the current validated basket subtotal
  - `basketSnapshot` must only include active products after revalidation

## State Transitions

- **Discovery flow**:
  - `idle` → `loading nearby merchants` → `loaded` or `empty` or `failed`
- **Merchant catalog flow**:
  - `merchant selected` → `branches loading` → `branch resolved` → `products loading` → `products loaded` or `empty` or `failed`
- **Basket flow**:
  - `empty basket` → `item added` → `quantity adjusted` → `validated for checkout` → `checkout started`
- **Checkout validation flow**:
  - `basket pending validation` → `validated` or `refresh required`
