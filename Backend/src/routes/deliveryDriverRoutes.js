import { Router } from 'express';
import {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
  activateDeliveryDriver,
  deactivateDeliveryDriver
} from '../controllers/deliveryDriverController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Rutas para repartidores
router.route('/')
  .get(protect, getAllDeliveryDrivers)        // GET /api/delivery-drivers - Obtener todos los repartidores
  .post(protect, createDeliveryDriver);       // POST /api/delivery-drivers - Crear nuevo repartidor

router.route('/:id')
  .get(protect, getDeliveryDriverById)        // GET /api/delivery-drivers/:id - Obtener repartidor por ID
  .put(protect, updateDeliveryDriver)         // PUT /api/delivery-drivers/:id - Actualizar repartidor
  .delete(protect, deleteDeliveryDriver);     // DELETE /api/delivery-drivers/:id - Eliminar repartidor

// Rutas para activar/desactivar repartidores
router.put('/:id/activate', protect, activateDeliveryDriver);     // PUT /api/delivery-drivers/:id/activate - Activar repartidor
router.put('/:id/deactivate', protect, deactivateDeliveryDriver); // PUT /api/delivery-drivers/:id/deactivate - Desactivar repartidor

export default router;
