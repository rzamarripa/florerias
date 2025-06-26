import express from "express";

import {
  bulkUpsertInvoices,
  getInvoices,
  getInvoicesSummary,
  getByProviderAndCompany,
  getSummaryByProviderAndCompany,
  markInvoiceAsFullyPaid,
  markInvoiceAsPartiallyPaid
} from '../controllers/importedInvoicesController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// router.use(protect);

router.post('/bulk-upsert', bulkUpsertInvoices);

router.get('/', getInvoices);

router.get('/summary', getInvoicesSummary);

router.get('/by-provider-company', getByProviderAndCompany);

router.get('/summary-by-provider-company', getSummaryByProviderAndCompany);

router.put('/:id/mark-as-paid', markInvoiceAsFullyPaid);

router.put('/:id/partial-payment', markInvoiceAsPartiallyPaid);

export default router; 