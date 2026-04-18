import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import braintree from 'braintree';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('--- BLITZPAY SERVER (Stripe + Braintree PayPal) ---');

const app = express();
const port = 3001;

// ---------- Stripe ----------
const keyPrefix = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'MISSING';
console.log(`Loading Stripe with key prefix: ${keyPrefix}`);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

// ---------- Braintree ----------
const btEnvName = (process.env.BRAINTREE_ENVIRONMENT ?? 'sandbox').toLowerCase();
const btEnv =
  btEnvName === 'production'
    ? braintree.Environment.Production
    : braintree.Environment.Sandbox;

const braintreeConfigured = Boolean(
  process.env.BRAINTREE_MERCHANT_ID &&
    process.env.BRAINTREE_PUBLIC_KEY &&
    process.env.BRAINTREE_PRIVATE_KEY,
);

const braintreeGateway = braintreeConfigured
  ? new braintree.BraintreeGateway({
      environment: btEnv,
      merchantId: process.env.BRAINTREE_MERCHANT_ID!,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
    })
  : null;

console.log(
  braintreeConfigured
    ? `[Braintree] Initialised (${btEnvName}) for merchant ${process.env.BRAINTREE_MERCHANT_ID?.slice(0, 4)}…`
    : '[Braintree] NOT configured — set BRAINTREE_* env vars',
);

app.use(express.json());

// ---------- Stripe endpoint ----------
app.post('/api/payments/create-intent', async (req, res) => {
  console.log('[Stripe] Incoming request body:', JSON.stringify(req.body));

  try {
    const { amount, currency = 'eur' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

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

// ---------- Braintree endpoints ----------
app.post('/api/payments/braintree/client-token', async (_req, res) => {
  if (!braintreeGateway) {
    res.status(503).json({ error: 'Braintree not configured on server' });
    return;
  }
  try {
    const response = await braintreeGateway.clientToken.generate({});
    if (!response.success) {
      console.error('[Braintree] clientToken.generate failed:', response.message);
      res.status(500).json({ error: response.message ?? 'Failed to generate client token' });
      return;
    }
    res.json({ clientToken: response.clientToken });
    try {
      const decoded = JSON.parse(Buffer.from(response.clientToken, 'base64').toString('utf8'));
      console.log('[Braintree] Issued client token', {
        version: decoded.version,
        environment: decoded.environment,
        merchantId: decoded.merchantId,
        configUrl: decoded.configUrl,
        fingerprintPrefix: String(decoded.authorizationFingerprint ?? '').slice(0, 24),
      });
    } catch {
      console.log('[Braintree] Issued client token (decode failed)');
    }
  } catch (err: any) {
    console.error('[Braintree] clientToken error:', err?.message ?? err);
    res.status(500).json({ error: 'Braintree client token generation failed' });
  }
});

app.post('/api/payments/braintree/checkout', async (req, res) => {
  if (!braintreeGateway) {
    res.status(503).json({ error: 'Braintree not configured on server' });
    return;
  }

  const { nonce, amount, currency = 'EUR', invoiceId } = req.body ?? {};

  if (!nonce || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'nonce and amount are required' });
    return;
  }

  try {
    const formattedAmount = amount.toFixed(2);
    const result = await braintreeGateway.transaction.sale({
      amount: formattedAmount,
      paymentMethodNonce: nonce,
      options: { submitForSettlement: true },
    });

    if (result.success && result.transaction) {
      const txId = result.transaction.id;
      console.log(
        `[Braintree] Sale OK — tx=${txId} amount=${formattedAmount} ${currency} invoice=${invoiceId ?? 'n/a'}`,
      );
      res.json({
        status: 'succeeded',
        transactionId: txId,
        amount: formattedAmount,
        currency,
      });
      return;
    }

    const message =
      result.transaction?.processorResponseText ??
      result.message ??
      'Braintree declined the transaction';
    const code = result.transaction?.processorResponseCode;
    console.warn(`[Braintree] Sale FAILED — code=${code ?? 'n/a'} message=${message}`);
    res.json({ status: 'failed', message, code });
  } catch (err: any) {
    console.error('[Braintree] sale error:', err?.message ?? err);
    res.status(500).json({ error: 'Braintree sale failed' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Payment server listening on port ${port} (http://localhost:${port})`);
});