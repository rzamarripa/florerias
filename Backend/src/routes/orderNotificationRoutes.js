import express from 'express';
import {
  getOrderNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../controllers/orderNotificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener todas las notificaciones del gerente
router.get('/', getOrderNotifications);

// Marcar notificación como leída
router.patch('/:id/read', markNotificationAsRead);

// Marcar todas las notificaciones como leídas
router.patch('/read-all', markAllNotificationsAsRead);

// Eliminar notificación
router.delete('/:id', deleteNotification);

export default router;
