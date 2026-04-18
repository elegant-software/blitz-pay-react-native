# Quickstart: Braintree PayPal Sandbox

## 1. Sandbox credentials

Add to `mobile/.env`:
```
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_MERCHANT_ID=<your-sandbox-merchant-id>
BRAINTREE_PUBLIC_KEY=<your-sandbox-public-key>
BRAINTREE_PRIVATE_KEY=<your-sandbox-private-key>
EXPO_PUBLIC_BRAINTREE_DROPIN_URL=${EXPO_PUBLIC_API_URL}/braintree/drop-in.html
```

Sandbox creds are under **Braintree Control Panel → Settings → API Keys**. A PayPal sandbox buyer can be created in the PayPal developer dashboard (or use the default one that comes with Braintree sandboxes).

## 2. Install

```bash
cd mobile
npm install braintree react-native-webview
```

## 3. Run

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — RN app (native build required because of WebView + Expo prebuild)
npm run ios    # or android
```

## 4. Try the flow

1. Navigate to any merchant and tap "Pay Now" → Checkout.
2. Select **PayPal**, tap **Confirm Payment**.
3. The Drop-in modal opens. Tap the PayPal button inside it.
4. Sign in with your sandbox buyer account in the popup.
5. On success, the modal closes and Checkout shows the success modal.

## 5. Test numbers & nonces

- Force a decline by submitting `amount = 2000.00` (sandbox convention → processor_declined).
- `fake-valid-nonce` can be used against `/api/payments/braintree/checkout` directly for smoke tests without launching the Drop-in.

## 6. Troubleshooting

- **"gateway_rejected – fraud"**: Check that `BRAINTREE_PUBLIC_KEY` matches the merchant id.
- **Drop-in fails to load**: `EXPO_PUBLIC_API_URL` must be reachable from the device (use ngrok or LAN IP).
- **WebView is blank on Android**: Ensure the URL is `https://` (or `http://` with `android:usesCleartextTraffic="true"` already set for dev).