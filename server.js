// IMPORTANT: configuration validation must run before routes/services load.
const config = require('../config/env');

const path = require('path');
const express = require('express');
const cors = require('cors');
const checkoutRouter = require('./routes/checkout');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: config.appName,
    environment: config.nodeEnv,
  });
});

app.use('/api/checkout', checkoutRouter);

// SPA fallback. API 404s are returned as JSON instead of index.html.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`${config.appName} server listening on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

module.exports = app;
