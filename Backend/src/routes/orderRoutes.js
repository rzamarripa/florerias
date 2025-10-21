import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersSummary
} from '../controllers/orderController.js';

const router = Router();

// Ruta para resumen de ventas (debe ir antes de /:id para evitar conflictos)
router.get('/summary', getOrdersSummary); // GET /api/orders/summary - Obtener resumen de ventas

// Rutas para órdenes
router.route('/')
  .get(getAllOrders)        // GET /api/orders - Obtener todas las órdenes
  .post(createOrder);       // POST /api/orders - Crear nueva orden

router.route('/:id')
  .get(getOrderById)        // GET /api/orders/:id - Obtener orden por ID
  .put(updateOrder)         // PUT /api/orders/:id - Actualizar orden
  .delete(deleteOrder);     // DELETE /api/orders/:id - Eliminar orden

// Ruta para actualizar estado de orden
router.put('/:id/status', updateOrderStatus); // PUT /api/orders/:id/status - Actualizar estado

export default router;
