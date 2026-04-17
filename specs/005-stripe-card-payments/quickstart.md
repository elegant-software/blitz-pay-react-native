# Quickstart: Stripe Card Payments

## Setup
1.  **Environment**: Ensure you have a Stripe account and the publishable key.
2.  **Installation**:
    \`\`\`bash
    cd mobile
    npx expo install @stripe/stripe-react-native
    \`\`\`
3.  **Config**: Update \`app.json\` with the Stripe plugin and camera permissions.
4.  **Provider**: Wrap the root application in \`StripeProvider\` with your \`urlScheme\`.

## Usage in Screens
\`\`\`typescript
import { useStripePayment } from '../hooks/useStripePayment';

const MyScreen = () => {
  const { initializePayment, openPaymentSheet, loading } = useStripePayment();

  const handlePay = async () => {
    // 1. Fetch keys from backend
    const data = await fetchPaymentIntent();
    
    // 2. Initialize
    await initializePayment(data);
    
    // 3. Open Sheet
    const result = await openPaymentSheet();
    
    if (result.status === 'succeeded') {
      // Handle success
    }
  };
}
\`\`\`

## Testing
- Use Stripe test cards (e.g., 4242...42).
- Use the 3D Secure test card: \`4000 0027 6000 3184\` to verify the authentication flow.
- Ensure you are running on a real device or a simulator with native code (not Expo Go).
