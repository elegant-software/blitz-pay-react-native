# Quickstart: Nearby Merchant Checkout

## Preconditions

- Mobile backend environment points at a backend that serves nearby merchants, merchant branches, products, and payment endpoints.
- Test data exists for:
  - at least one merchant near the test coordinates
  - at least one active branch for that merchant
  - at least two active products for the resolved branch
- The mobile app is configured with valid authentication or auth bypass for non-payment-only checks.

## Setup

1. In `mobile/.env`, set the backend base URL to the target environment.
2. Install dependencies:
   ```bash
   cd /Users/mehdi/MyProject/blitz-pay-prototype/mobile
   npm install
   ```
3. Start the mobile app:
   ```bash
   npm run ios
   ```
   or
   ```bash
   npm run android
   ```

## Validation Flow

1. Grant location permission.
2. Open the landing screen.
3. Confirm the nearby merchant section shows live nearby merchants and no mock merchant cards.
4. Select a nearby merchant.
5. Confirm the merchant detail screen resolves the merchant’s active shopping branch and loads active products from live backend data.
6. Add at least two different products.
7. Increase the quantity of one product and decrease another.
8. Confirm the basket total updates immediately after each quantity change.
9. Proceed to checkout.
10. Confirm the checkout screen shows the correct merchant context and the aggregated basket total.
11. Trigger payment using an existing payment method and confirm the flow starts with the validated basket amount.

## Failure and Edge Checks

- Revoke location permission and confirm the landing screen shows a retry-oriented fallback.
- Test a merchant with no active products and confirm checkout is not offered.
- Change product data in the backend between product selection and checkout and confirm the app requires a basket refresh before payment proceeds.
- Trigger a geofence refresh while the app is active and confirm the nearby merchant list updates without restoring mock data.
