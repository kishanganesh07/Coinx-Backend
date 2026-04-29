const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  data: { type: Array, required: true }
});

module.exports = mongoose.model('Report', reportSchema);
