const Transaction = require('../models/Transaction.model');

exports.run = async (runId, config) => {
  const userTxs = await Transaction.find({ runId, source: 'USER' });
  const exchangeTxs = await Transaction.find({ runId, source: 'EXCHANGE' });

  let results = [];
  let usedExchangeIndices = new Set();

  userTxs.forEach((u) => {
    // 1. If user row is invalid, it's unmatched
    if (!u.isValid) {
      results.push({
        status: "UNMATCHED_USER",
        user: u.originalData,
        exchange: null,
        reason: u.validationError
      });
      return;
    }

    let bestMatch = null;
    let conflict = null;

    for (let i = 0; i < exchangeTxs.length; i++) {
      if (usedExchangeIndices.has(i)) continue;
      const e = exchangeTxs[i];
      if (!e.isValid) continue;

      // Basic hard requirements: Asset and Type must match
      if (u.normalizedAsset !== e.normalizedAsset || u.type !== e.type) continue;

      const timeDiff = Math.abs(u.timestamp - e.timestamp) / 1000;
      const qtyDiffPct = Math.abs(u.quantity - e.quantity) / (e.quantity || 1) * 100;

      const timeMatch = timeDiff <= config.time;
      const qtyMatch = qtyDiffPct <= config.qty;

      if (timeMatch && qtyMatch) {
        bestMatch = { index: i, data: e };
        break; // Found a perfect match
      } else if (timeMatch || (u.transactionId && u.transactionId === e.transactionId)) {
        // Proximity match but values differ -> Conflicting
        conflict = { index: i, data: e, reason: !qtyMatch ? "Quantity out of tolerance" : "Timestamp out of tolerance" };
      }
    }

    if (bestMatch) {
      results.push({
        status: "MATCHED",
        user: u.originalData,
        exchange: bestMatch.data.originalData,
        reason: "Matched within tolerances"
      });
      usedExchangeIndices.add(bestMatch.index);
    } else if (conflict) {
      results.push({
        status: "CONFLICTING",
        user: u.originalData,
        exchange: conflict.data.originalData,
        reason: conflict.reason
      });
      usedExchangeIndices.add(conflict.index);
    } else {
      results.push({
        status: "UNMATCHED_USER",
        user: u.originalData,
        exchange: null,
        reason: "No matching exchange record found"
      });
    }
  });

  // Handle unmatched exchange records
  exchangeTxs.forEach((e, i) => {
    if (!usedExchangeIndices.has(i)) {
      results.push({
        status: "UNMATCHED_EXCHANGE",
        user: null,
        exchange: e.originalData,
        reason: !e.isValid ? e.validationError : "No user record found"
      });
    }
  });

  return results;
};
