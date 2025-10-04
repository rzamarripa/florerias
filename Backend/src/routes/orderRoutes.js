import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} from '../controllers/orderController.js';

const router = Router();

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
