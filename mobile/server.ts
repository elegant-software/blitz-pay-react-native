import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('--- STRIPE SERVER VERSION 2.0 (NO HARDCODED API VERSION) ---');

const app = express();
const port = 3001;

// Debug log (Safe: only shows prefix)
const keyPrefix = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'MISSING';
console.log(`Loading Stripe with key prefix: ${keyPrefix}`);

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

app.use(express.json());

// Endpoint to create a PaymentIntent
app.post('/api/payments/create-intent', async (req, res) => {
  console.log('[Stripe] Incoming request body:', JSON.stringify(req.body));
  
  try {
    const { amount, currency = 'eur' } = req.body;

    // Log the SDK's own view of the config
    console.log('[Stripe] SDK Config API Version:', (stripe as any)._config?.apiVersion || 'Default');

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create an Ephemeral Key (optional but good practice for customers)
    // For simplicity, we just return the paymentIntent and publishableKey
    res.json({
      paymentIntent: paymentIntent.client_secret,
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
    
    console.log(`Created PaymentIntent: ${paymentIntent.id} for €${amount}`);
  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Payment server is listening on port ${port} (Available at http://localhost:${port} and your local IP)`);
});
