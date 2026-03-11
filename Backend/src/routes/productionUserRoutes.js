import { Router } from 'express';
import {
  getAllProductionUsers,
  getProductionUserById,
  createProductionUser,
  updateProductionUser,
  deleteProductionUser,
  activateProductionUser,
  deactivateProductionUser
} from '../controllers/productionUserController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Rutas para usuarios de producción
router.route('/')
  .get(protect, getAllProductionUsers)         // GET /api/production-users - Obtener todos los usuarios de producción
  .post(protect, createProductionUser);        // POST /api/production-users - Crear nuevo usuario de producción

router.route('/:id')
  .get(protect, getProductionUserById)         // GET /api/production-users/:id - Obtener usuario por ID
  .put(protect, updateProductionUser)          // PUT /api/production-users/:id - Actualizar usuario
  .delete(protect, deleteProductionUser);      // DELETE /api/production-users/:id - Eliminar usuario

// Rutas para activar/desactivar usuarios de producción
router.put('/:id/activate', protect, activateProductionUser);     // PUT /api/production-users/:id/activate - Activar usuario
router.put('/:id/deactivate', protect, deactivateProductionUser); // PUT /api/production-users/:id/deactivate - Desactivar usuario

export default router;
