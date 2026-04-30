const express = require('express');
const routes = require('./routes/reconcile.routes');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'UP' }));

app.use('/', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
