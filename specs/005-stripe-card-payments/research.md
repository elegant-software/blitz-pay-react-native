# Research: Stripe React Native Integration

## Decision: Use Stripe PaymentSheet

### Rationale
Stripe's `PaymentSheet` is the recommended way to integrate payments in React Native. It provides a pre-built UI that:
1.  **Handles Card Scanning**: Built-in support for scanning cards via camera (iOS) or Google Card Recognition (Android).
2.  **SCA/3D Secure**: Automatically manages the 3D Secure authentication flow, including redirects.
3.  **UI/UX**: Provides a polished, localized, and PCI-compliant payment interface with minimal custom code.
4.  **Save Card**: Supports saving payment methods for future use with `SetupIntents` or `PaymentIntents` with `setup_future_usage`.

### Implementation Details
- **Dependency**: `@stripe/stripe-react-native`
- **Expo Config**: Add to `plugins` in `app.json` with `merchantIdentifier` and `enableGooglePay`.
- **Permissions**: Add `NSCameraUsageDescription` to `app.json` for iOS card scanning.
- **Deep Linking**: Configure `urlScheme` in `StripeProvider` and `app.json` for 3D Secure redirects.
- **Build**: Requires native builds (`npx expo run:ios` / `android`) or EAS Build; standard Expo Go will not work.

### Alternatives Considered
1.  **`CardField` / `CardForm`**: Rejected because they do **not** support card scanning natively. Implementing custom scanning logic would be complex and higher maintenance.
2.  **Webview-based Checkout**: Rejected for inferior user experience and more complex deep link handling compared to the native SDK.

## Unknowns Resolved
- **Card Scanning**: Confirmed support via `PaymentSheet`.
- **3D Secure**: Confirmed automatic handling via `PaymentSheet` + `urlScheme`.
- **Deep Linking**: Identified as critical for 3D Secure completion.

## Best Practices
- Use webhooks to confirm payment success.
- Ensure `compileSdkVersion` is 34+ for Android.
- Always provide a `merchantDisplayName` in `initPaymentSheet`.
