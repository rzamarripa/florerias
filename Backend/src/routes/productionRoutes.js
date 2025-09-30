import { Router } from 'express';
import {
  getAllProduction,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  activateProduction,
  deactivateProduction
} from '../controllers/productionController.js';

const router = Router();

// Middleware de autenticación (descomenta si tienes middleware de auth)
// const { protect } = require('../middleware/auth');

// Rutas para personal de producción
router.route('/')
  .get(getAllProduction)        // GET /api/production - Obtener todo el personal de producción
  .post(createProduction);      // POST /api/production - Crear nuevo personal de producción

router.route('/:id')
  .get(getProductionById)       // GET /api/production/:id - Obtener personal de producción por ID
  .put(updateProduction)        // PUT /api/production/:id - Actualizar personal de producción
  .delete(deleteProduction);    // DELETE /api/production/:id - Eliminar personal de producción

// Rutas para activar/desactivar personal de producción
router.put('/:id/activate', activateProduction);     // PUT /api/production/:id/activate - Activar personal de producción
router.put('/:id/deactivate', deactivateProduction); // PUT /api/production/:id/deactivate - Desactivar personal de producción

export default router;