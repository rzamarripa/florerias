import express from 'express';
import {
  createOrderPayment,
  getOrderPayments,
  getOrderPaymentById,
  deleteOrderPayment,
  getAllOrderPayments,
  getOrderPaymentsByBranch
} from '../controllers/orderPaymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para pagos de órdenes
router.post('/', createOrderPayment);
router.get('/', getAllOrderPayments);
router.get('/by-branch', getOrderPaymentsByBranch);
router.get('/order/:orderId', getOrderPayments);
router.get('/:id', getOrderPaymentById);
router.delete('/:id', deleteOrderPayment);

export default router;
