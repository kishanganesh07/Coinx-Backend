const express = require('express');
const router = express.Router();
const controller = require('../controllers/reconcile.controller');
router.post('/reconcile', controller.reconcile);
router.get('/report/:id', controller.getReport);
router.get('/report/:id/summary', controller.getSummary);
router.get('/report/:id/unmatched', controller.getUnmatched);
module.exports = router;
