import { Router } from 'express';
import {
  getAllDealers,
  getDealerById,
  createDealer,
  updateDealer,
  deleteDealer,
  activateDealer,
  deactivateDealer
} from '../controllers/dealerController.js';

const router = Router();

// Rutas para delivery
router.route('/')
  .get(getAllDealers)        // GET /api/delivery - Obtener todos los delivery
  .post(createDealer);       // POST /api/delivery - Crear nuevo delivery

router.route('/:id')
  .get(getDealerById)        // GET /api/delivery/:id - Obtener delivery por ID
  .put(updateDealer)         // PUT /api/delivery/:id - Actualizar delivery
  .delete(deleteDealer);     // DELETE /api/delivery/:id - Eliminar delivery

// Rutas para activar/desactivar delivery
router.put('/:id/activate', activateDealer);     // PUT /api/delivery/:id/activate - Activar delivery
router.put('/:id/deactivate', deactivateDealer); // PUT /api/delivery/:id/deactivate - Desactivar delivery

export default router;
