import express from 'express';
import {
  requestDiscountAuth,
  approveRejectDiscountAuth,
  getAllDiscountAuths,
  getDiscountAuthById,
  redeemDiscountFolio,
  createDiscountAuthForOrder,
  redeemAuthorizationForOrder
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
router.post('/create-for-order', createDiscountAuthForOrder);
router.post('/:id/approve-reject', approveRejectDiscountAuth);
router.post('/redeem', redeemDiscountFolio);
router.post('/redeem-for-order', redeemAuthorizationForOrder);

export default router;
