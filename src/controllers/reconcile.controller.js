const { v4: uuid } = require('uuid');
const ingestion = require('../services/ingestion.service');
const match = require('../services/match.service');
const reportService = require('../services/report.service');

exports.reconcile = async (req, res) => {
  try {
    const runId = uuid();
    const config = {
      time: parseInt(req.body?.time || process.env.TIMESTAMP_TOLERANCE_SECONDS || 300),
      qty: parseFloat(req.body?.qty || process.env.QUANTITY_TOLERANCE_PCT || 0.01)
    };

    // 1. Ingestion (Saves to DB)
    await ingestion.loadCSV('data/user_transactions.csv', runId, 'USER');
    await ingestion.loadCSV('data/exchange_transactions.csv', runId, 'EXCHANGE');

    // 2. Matching (Pulls from DB)
    const results = await match.run(runId, config);

    // 3. Save Report
    // We'll use the generated uuid as the internal ID for simplicity or just save it.
    // The reportService.save returns the MongoDB _id, but we'll include runId in data.
    const dbId = await reportService.save(results);

    res.json({ message: "Reconciliation triggered", runId: dbId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Reconciliation failed" });
  }
};

exports.getReport = async (req, res) => {
  const csv = await reportService.generateCSV(req.params.id);
  if (!csv) return res.status(404).json({ error: "Report not found" });

  res.setHeader('Content-disposition', `attachment; filename=report_${req.params.id}.csv`);
  res.set('Content-Type', 'text/csv');
  res.send(csv);
};

exports.getSummary = async (req, res) => {
  const data = await reportService.summary(req.params.id);
  res.json(data);
};

exports.getUnmatched = async (req, res) => {
  const data = await reportService.unmatched(req.params.id);
  res.json(data);
};
