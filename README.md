# TZ Trade Hub

Node.js + Express marketplace with ClickPesa mobile-money checkout.

## Configuration

The application validates required ClickPesa credentials **before Express routes and payment services load**.

Required variables:

- `CLICKPESA_CLIENT_ID`
- `CLICKPESA_API_KEY`

Optional variables:

- `APP_NAME` (default: `TZ Trade Hub`)
- `NODE_ENV` (default: `development`)
- `PORT` (default: `3000`; Render supplies its own `PORT`)
- `CLICKPESA_BASE_URL` (default: `https://api.clickpesa.com/third-parties`)
- `APP_BASE_URL` (public application URL)

## Local development

```bash
cp .env.example .env
# Edit .env and provide your own ClickPesa credentials.
npm install
npm run dev
```

If a required ClickPesa variable is missing, startup stops with a clear error instead of allowing the app to run with a broken payment integration.

## Render deployment

1. Create/import the Render Web Service from this repository.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. In **Render Dashboard -> your service -> Environment**, add:
   - `CLICKPESA_CLIENT_ID`
   - `CLICKPESA_API_KEY`
   - `NODE_ENV=production`
   - `CLICKPESA_BASE_URL=https://api.clickpesa.com/third-parties`
   - `APP_BASE_URL=https://<your-render-domain>`
5. Save changes and redeploy.
6. Verify `https://<your-render-domain>/api/health` returns HTTP 200.

Never commit `.env` or put real ClickPesa secrets in `render.yaml` or `.env.example`.

## API

- `POST /api/checkout/preview`
- `POST /api/checkout/initiate`
- `GET /api/checkout/status/:orderReference`
- `POST /api/checkout/webhook`

Before processing real money, verify the payment endpoints/payloads and webhook security against ClickPesa's current official API documentation. ClickPesa currently advertises REST API USSD-PUSH collections and real-time webhooks; webhook verification/checksum validation should be implemented before production use.
