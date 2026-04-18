# Research: Braintree PayPal Sandbox Integration

## Decision: Drop-in UI hosted via WebView

### Rationale
Braintree's **`braintree-web-drop-in`** (JavaScript) is the supported, maintained path for sandbox PayPal flows. Rendering it inside a `react-native-webview` gives us:
1. **Zero native code**: No changes to iOS/Android projects, no custom EAS build.
2. **Fast iteration**: The Drop-in page is static HTML + CDN scripts, hot-reloadable from the Express sidecar.
3. **PayPal + future cards**: Drop-in supports adding card, Venmo, and Apple Pay later by flipping config flags — only PayPal is enabled now.
4. **PCI-safe**: Buyer enters credentials inside PayPal's own domain inside the iframe; the app only sees a nonce.

### Implementation Details
- **Server SDK**: `braintree@^3` with environment `Braintree.Environment.Sandbox`.
- **Client token**: Generated per request via `gateway.clientToken.generate({})`. No customer vaulting in this iteration.
- **Transaction**: `gateway.transaction.sale({ amount, paymentMethodNonce, options: { submitForSettlement: true } })`.
- **Bridge**: Drop-in page calls `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'nonce', nonce }))`. The RN `onMessage` handler then POSTs to `/api/payments/braintree/checkout`.
- **Cancellation**: When the user closes the WebView modal, the RN side resolves with `{ status: 'cancelled' }` and never calls the sale endpoint.

### Alternatives Considered
1. **`react-native-braintree-dropin-ui`** (community native module): Rejected. Unmaintained in recent RN versions; requires Android/iOS linking which would force an EAS build cycle for a prototype.
2. **PayPal REST API directly**: Rejected. Would duplicate what Braintree's SDK already handles (nonce → settlement, refunds, webhooks) and lose vault-readiness.
3. **WebBrowser (external browser)**: Rejected. Loses the `postMessage` bridge, requires deep-link plumbing, and feels disconnected from the Checkout flow.

## Unknowns Resolved
- **Sandbox PayPal linking**: Braintree sandbox merchants auto-get a linked PayPal sandbox business account — no extra setup.
- **Currency**: Sandbox accepts EUR/USD/GBP for transactions. We submit EUR to match the Stripe flow.
- **Test buyer**: Use a PayPal sandbox buyer (email/password) from the PayPal developer dashboard.

## Best Practices
- Generate client tokens per checkout rather than reusing; keeps scope tight.
- Never log the raw nonce or buyer email; log only the transaction id and status.
- Use `submitForSettlement: true` so the sandbox reflects settlement states the UI can inspect.
- Keep the WebView page on **same origin** as the Express server to avoid mixed-content issues on Android.