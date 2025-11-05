import express from 'express';
import {
  createEventPayment,
  getEventPayments,
  getEventPaymentById,
  deleteEventPayment,
  getAllEventPayments
} from '../controllers/eventPaymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de pagos de eventos
router.post('/', createEventPayment);
router.get('/', getAllEventPayments);
router.get('/event/:eventId', getEventPayments);
router.get('/:id', getEventPaymentById);
router.delete('/:id', deleteEventPayment);

export default router;
