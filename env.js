// config/env.js
// Load local .env values before anything else reads process.env.
require('dotenv').config();

const required = [
  'CLICKPESA_CLIENT_ID',
  'CLICKPESA_API_KEY',
];

const missing = required.filter((name) => {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim() === '';
});

if (missing.length > 0) {
  console.error('\n❌ TZ TRADE HUB cannot start. Required environment variables are missing:');
  for (const name of missing) {
    console.error(`   - ${name}`);
  }
  console.error('\nLocal development: copy .env.example to .env and fill in the values.');
  console.error('Render: add the variables in Dashboard → Service → Environment.\n');
  process.exit(1);
}

const port = Number.parseInt(process.env.PORT || '3000', 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`\n❌ Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

module.exports = Object.freeze({
  appName: process.env.APP_NAME || 'TZ Trade Hub',
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  appBaseUrl: process.env.APP_BASE_URL || '',
  clickpesa: Object.freeze({
    clientId: process.env.CLICKPESA_CLIENT_ID.trim(),
    apiKey: process.env.CLICKPESA_API_KEY.trim(),
    baseUrl: (process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com/third-parties').replace(/\/$/, ''),
  }),
});
