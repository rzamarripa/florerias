import { Router } from 'express';
import {
  getAllCashiers,
  getCashierById,
  createCashier,
  updateCashier,
  deleteCashier,
  activateCashier,
  deactivateCashier
} from '../controllers/cashierController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Rutas para cajeros
router.route('/')
  .get(protect, getAllCashiers)        // GET /api/cashiers - Obtener todos los cajeros
  .post(protect, createCashier);       // POST /api/cashiers - Crear nuevo cajero

router.route('/:id')
  .get(protect, getCashierById)        // GET /api/cashiers/:id - Obtener cajero por ID
  .put(protect, updateCashier)         // PUT /api/cashiers/:id - Actualizar cajero
  .delete(protect, deleteCashier);     // DELETE /api/cashiers/:id - Eliminar cajero

// Rutas para activar/desactivar cajeros
router.put('/:id/activate', protect, activateCashier);     // PUT /api/cashiers/:id/activate - Activar cajero
router.put('/:id/deactivate', protect, deactivateCashier); // PUT /api/cashiers/:id/deactivate - Desactivar cajero

export default router;