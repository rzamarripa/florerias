import express from 'express';
import {
  requestDiscountAuth,
  approveRejectDiscountAuth,
  getAllDiscountAuths,
  getDiscountAuthById,
  redeemDiscountFolio
} from '../controllers/discountAuthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas GET
router.get('/', getAllDiscountAuths);
router.get('/:id', getDiscountAuthById);

// Rutas POST
router.post('/request', requestDiscountAuth);
router.post('/:id/approve-reject', approveRejectDiscountAuth);
router.post('/redeem', redeemDiscountFolio);

export default router;
