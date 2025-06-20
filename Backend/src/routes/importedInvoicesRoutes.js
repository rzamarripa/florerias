import express from "express";

import {
  bulkUpsertInvoices,
  getInvoices,
  getInvoicesSummary,
} from '../controllers/importedInvoicesController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// router.use(protect);

router.post('/bulk-upsert', bulkUpsertInvoices);

router.get('/', getInvoices);

router.get('/summary', getInvoicesSummary);

export default router; 