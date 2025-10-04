import { Router } from 'express';
import {
  getAllManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
  activateManager,
  deactivateManager
} from '../controllers/managerController.js';

const router = Router();

// Rutas para managers
router.route('/')
  .get(getAllManagers)        // GET /api/managers - Obtener todos los managers
  .post(createManager);       // POST /api/managers - Crear nuevo manager

router.route('/:id')
  .get(getManagerById)        // GET /api/managers/:id - Obtener manager por ID
  .put(updateManager)         // PUT /api/managers/:id - Actualizar manager
  .delete(deleteManager);     // DELETE /api/managers/:id - Eliminar manager

// Rutas para activar/desactivar managers
router.put('/:id/activate', activateManager);     // PUT /api/managers/:id/activate - Activar manager
router.put('/:id/deactivate', deactivateManager); // PUT /api/managers/:id/deactivate - Desactivar manager

export default router;
