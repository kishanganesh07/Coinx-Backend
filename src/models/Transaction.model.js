const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  runId: { type: String, required: true },
  source: { type: String, enum: ['USER', 'EXCHANGE'], required: true },
  transactionId: String,
  timestamp: Date,
  type: String,
  asset: String,
  normalizedAsset: String,
  quantity: Number,
  originalData: Object,
  isValid: { type: Boolean, default: true },
  validationError: String
});

module.exports = mongoose.model('Transaction', transactionSchema);
