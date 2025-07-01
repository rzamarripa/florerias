import express from "express";

import {
  bulkUpsertInvoices,
  getInvoices,
  getInvoicesSummary,
  getByProviderAndCompany,
  getSummaryByProviderAndCompany,
  markInvoiceAsFullyPaid,
  markInvoiceAsPartiallyPaid,
  toggleFacturaAutorizada,
  updateImporteAPagar,
  getInvoiceById
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

router.patch('/:id/toggle-autorizada', toggleFacturaAutorizada);

router.put('/:id/update-importe-apagar', updateImporteAPagar);

router.get('/:id', getInvoiceById);

export default router; 