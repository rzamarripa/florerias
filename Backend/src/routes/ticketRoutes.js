import express from 'express';
import {
  createTicket,
  getTicketsByOrderId,
  getStoreTicket,
  getDeliveryTicket,
  deleteTicket
} from '../controllers/ticketController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Crear un nuevo ticket
router.post('/', createTicket);

// Obtener todos los tickets de una orden
router.get('/order/:orderId', getTicketsByOrderId);

// Obtener ticket de venta (tienda) de una orden
router.get('/order/:orderId/store', getStoreTicket);

// Obtener ticket de envío de una orden
router.get('/order/:orderId/delivery', getDeliveryTicket);

// Eliminar un ticket
router.delete('/:id', deleteTicket);

export default router;