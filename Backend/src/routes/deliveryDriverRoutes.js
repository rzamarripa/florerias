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

const router = Router();

// Middleware de autenticación (descomenta si tienes middleware de auth)
// const { protect } = require('../middleware/auth');

// Rutas para repartidores
router.route('/')
  .get(getAllDeliveryDrivers)        // GET /api/delivery-drivers - Obtener todos los repartidores
  .post(createDeliveryDriver);       // POST /api/delivery-drivers - Crear nuevo repartidor

router.route('/:id')
  .get(getDeliveryDriverById)        // GET /api/delivery-drivers/:id - Obtener repartidor por ID
  .put(updateDeliveryDriver)         // PUT /api/delivery-drivers/:id - Actualizar repartidor
  .delete(deleteDeliveryDriver);     // DELETE /api/delivery-drivers/:id - Eliminar repartidor

// Rutas para activar/desactivar repartidores
router.put('/:id/activate', activateDeliveryDriver);     // PUT /api/delivery-drivers/:id/activate - Activar repartidor
router.put('/:id/deactivate', deactivateDeliveryDriver); // PUT /api/delivery-drivers/:id/deactivate - Desactivar repartidor

export default router;