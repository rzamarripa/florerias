import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCompaniesSalesSummary,
  getCompanySalesDetail
} from '../controllers/companySalesController.js';

const router = Router();

// Obtener resumen de ventas de todas las empresas
router.get('/summary', protect, getCompaniesSalesSummary);

// Obtener detalle de ventas de una empresa específica
router.get('/:companyId/detail', protect, getCompanySalesDetail);

export default router;