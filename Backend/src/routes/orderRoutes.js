import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersSummary,
  sendOrderToShipping,
  updateOrderDeliveryInfo,
  getUnauthorizedOrders
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Ruta para resumen de ventas (debe ir antes de /:id para evitar conflictos)
router.get('/summary', getOrdersSummary); // GET /api/orders/summary - Obtener resumen de ventas

// Ruta para órdenes sin autorizar (debe ir antes de /:id para evitar conflictos)
router.get('/unauthorized', getUnauthorizedOrders); // GET /api/orders/unauthorized - Obtener órdenes sin autorizar

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

// Ruta para actualizar información de entrega
router.put('/:id/delivery', updateOrderDeliveryInfo); // PUT /api/orders/:id/delivery - Actualizar info de entrega

// Ruta para enviar orden a pizarrón de Envío
router.put('/:id/send-to-shipping', sendOrderToShipping); // PUT /api/orders/:id/send-to-shipping - Enviar a Envío

export default router;
