const fs = require('fs');
const csv = require('csv-parser');
const Transaction = require('../models/Transaction.model');
const { normalize } = require('../utils/helpers');

exports.loadCSV = (file, runId, source) => {
  return new Promise((resolve, reject) => {
    let results = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', async (row) => {
        let isValid = true;
        let error = null;

        // Basic validation
        if (!row.timestamp || isNaN(new Date(row.timestamp).getTime())) {
          isValid = false;
          error = "Missing or malformed timestamp";
        }
        if (!row.quantity || isNaN(parseFloat(row.quantity))) {
          isValid = false;
          error = error ? error + " / Invalid quantity" : "Invalid quantity";
        }

        const normalized = normalize(row);

        const tx = new Transaction({
          runId,
          source,
          transactionId: row.transaction_id || row.id,
          timestamp: isValid ? normalized.timestamp : null,
          type: normalized.type,
          asset: row.asset,
          normalizedAsset: normalized.asset,
          quantity: normalized.quantity,
          originalData: row,
          isValid,
          validationError: error
        });
        
        results.push(tx.save());
      })
      .on('end', async () => {
        await Promise.all(results);
        resolve();
      })
      .on('error', reject);
  });
};
