import { Router } from 'express';
import * as branchSalesController from '../controllers/branchSalesController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Ruta para obtener resumen de ventas de sucursales específicas
router.post(
  '/summary',
  protect,
  branchSalesController.getBranchesSalesSummary
);

export default router;