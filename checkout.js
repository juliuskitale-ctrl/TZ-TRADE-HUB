const express = require('express');
const clickpesa = require('../payments/clickpesa');

const router = express.Router();

function genOrderReference() {
  return `TZTH-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

// POST /api/checkout/preview
// Body: { amount, phoneNumber, currency? }
router.post('/preview', async (req, res) => {
  try {
    const { amount, phoneNumber, currency } = req.body || {};
    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'amount and phoneNumber are required' });
    }

    const orderReference = genOrderReference();
    const preview = await clickpesa.previewCheckout({
      amount,
      currency,
      orderReference,
      phoneNumber,
    });

    res.json({ orderReference, preview });
  } catch (err) {
    console.error('Checkout preview failed:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/checkout/initiate
// Body: { amount, phoneNumber, currency? }
router.post('/initiate', async (req, res) => {
  try {
    const { amount, phoneNumber, currency } = req.body || {};
    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'amount and phoneNumber are required' });
    }

    const orderReference = genOrderReference();
    const result = await clickpesa.initiateCheckout({
      amount,
      currency,
      orderReference,
      phoneNumber,
    });

    res.json({ orderReference, result });
  } catch (err) {
    console.error('Checkout initiate failed:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/checkout/status/:orderReference
router.get('/status/:orderReference', async (req, res) => {
  try {
    const status = await clickpesa.getPaymentStatus(req.params.orderReference);
    res.json(status);
  } catch (err) {
    console.error('Checkout status check failed:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/checkout/webhook
// ClickPesa calls this URL to confirm payment completion.
// Register this exact path in your ClickPesa dashboard:
//   https://<your-app-domain>/api/checkout/webhook
router.post('/webhook', express.json(), (req, res) => {
  // TODO: verify the webhook signature/checksum per ClickPesa's docs
  // before trusting this payload in production.
  console.log('ClickPesa webhook received:', JSON.stringify(req.body));

  // TODO: update your order/payment records here based on req.body.

  res.status(200).json({ received: true });
});

module.exports = router;
