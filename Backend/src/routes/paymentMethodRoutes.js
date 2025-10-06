import { Router } from 'express';
import {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  updatePaymentMethodStatus,
  deletePaymentMethod
} from '../controllers/paymentMethodController.js';

const router = Router();

// Rutas para métodos de pago
router.route('/')
  .get(getAllPaymentMethods)        // GET /api/payment-methods - Obtener todos los métodos de pago
  .post(createPaymentMethod);       // POST /api/payment-methods - Crear nuevo método de pago

router.route('/:id')
  .get(getPaymentMethodById)        // GET /api/payment-methods/:id - Obtener método de pago por ID
  .put(updatePaymentMethod)         // PUT /api/payment-methods/:id - Actualizar método de pago
  .delete(deletePaymentMethod);     // DELETE /api/payment-methods/:id - Eliminar método de pago

// Ruta para actualizar estado
router.put('/:id/status', updatePaymentMethodStatus); // PUT /api/payment-methods/:id/status - Actualizar estado

export default router;
