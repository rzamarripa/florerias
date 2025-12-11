import express from 'express';
import { getOrderLogs, getOrderLogById } from '../controllers/orderLogController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.get('/:orderId', protect, getOrderLogs);
router.get('/log/:logId', protect, getOrderLogById);

export default router;
