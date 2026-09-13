/**
 * ClickPesa mobile money integration.
 *
 * SECURITY: This module reads credentials ONLY from environment variables.
 * There are intentionally no hardcoded fallback values. If the required
 * env vars are missing, the app fails fast at startup with a clear error
 * instead of silently running with bad/missing credentials.
 *
 * Set the real values in your hosting provider's dashboard (Render:
 * Service -> Environment), never in source code or committed .env files.
 *
 * NOTE: Verify exact endpoint paths/payloads against ClickPesa's official
 * API docs (https://docs.clickpesa.com) before going live — mobile money
 * API details can change, and this module should be treated as a
 * well-structured starting point, not a guaranteed-current spec.
 */

const fetch = require('node-fetch');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set it in your .env file locally, or in Render's Environment settings in production.`
    );
  }
  return value;
}

class ClickPesaClient {
  constructor() {
    // Lazily validated — see _getConfig(). We don't throw at module
    // load time so the rest of the app can still boot (e.g. for
    // health checks) even if payments aren't configured yet.
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  _getConfig() {
    return {
      clientId: requireEnv('CLICKPESA_CLIENT_ID'),
      apiKey: requireEnv('CLICKPESA_API_KEY'),
      baseUrl: process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com/third-parties',
    };
  }

  /**
   * Get a valid auth token, fetching/refreshing it if needed.
   */
  async _getToken() {
    const now = Date.now();
    if (this._token && now < this._tokenExpiresAt) {
      return this._token;
    }

    const { clientId, apiKey, baseUrl } = this._getConfig();

    const res = await fetch(`${baseUrl}/generate-token`, {
      method: 'POST',
      headers: {
        'client-id': clientId,
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`ClickPesa auth failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    this._token = data.token;
    // Refresh a little early to avoid edge-of-expiry failures.
    const ttlMs = (data.expiresIn ? data.expiresIn * 1000 : 5 * 60 * 1000);
    this._tokenExpiresAt = now + ttlMs - 30_000;

    return this._token;
  }

  /**
   * Preview a mobile money payment: shows available methods/fees
   * before actually charging the customer.
   */
  async previewCheckout({ amount, currency = 'TZS', orderReference, phoneNumber }) {
    const { baseUrl } = this._getConfig();
    const token = await this._getToken();

    const res = await fetch(`${baseUrl}/payments/preview-ussd-push-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency,
        orderReference,
        phoneNumber,
      }),
    });

    return this._handleResponse(res);
  }

  /**
   * Initiate a USSD push mobile money checkout — this is what actually
   * prompts the customer's phone to approve the payment.
   */
  async initiateCheckout({ amount, currency = 'TZS', orderReference, phoneNumber }) {
    const { baseUrl } = this._getConfig();
    const token = await this._getToken();

    const res = await fetch(`${baseUrl}/payments/initiate-ussd-push-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency,
        orderReference,
        phoneNumber,
      }),
    });

    return this._handleResponse(res);
  }

  /**
   * Poll for the current status of a payment by order reference.
   */
  async getPaymentStatus(orderReference) {
    const { baseUrl } = this._getConfig();
    const token = await this._getToken();

    const res = await fetch(
      `${baseUrl}/payments/${encodeURIComponent(orderReference)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return this._handleResponse(res);
  }

  async _handleResponse(res) {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const message = data?.message || `ClickPesa API error (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.details = data;
      throw err;
    }

    return data;
  }
}

module.exports = new ClickPesaClient();
