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

const router = Router();

// Middleware de autenticación (descomenta si tienes middleware de auth)
// const { protect } = require('../middleware/auth');

// Rutas para cajeros
router.route('/')
  .get(getAllCashiers)        // GET /api/cashiers - Obtener todos los cajeros
  .post(createCashier);       // POST /api/cashiers - Crear nuevo cajero

router.route('/:id')
  .get(getCashierById)        // GET /api/cashiers/:id - Obtener cajero por ID
  .put(updateCashier)         // PUT /api/cashiers/:id - Actualizar cajero
  .delete(deleteCashier);     // DELETE /api/cashiers/:id - Eliminar cajero

// Rutas para activar/desactivar cajeros
router.put('/:id/activate', activateCashier);     // PUT /api/cashiers/:id/activate - Activar cajero
router.put('/:id/deactivate', deactivateCashier); // PUT /api/cashiers/:id/deactivate - Desactivar cajero

export default router;