import { Router } from 'express';
import {
  getAllProductionUsers,
  getProductionUserById,
  updateProductionUser,
  deleteProductionUser,
  activateProductionUser,
  deactivateProductionUser
} from '../controllers/productionUserController.js';

const router = Router();

// Middleware de autenticación (descomenta si tienes middleware de auth)
// const { protect } = require('../middleware/auth');

// Rutas para usuarios de producción
router.route('/')
  .get(getAllProductionUsers);        // GET /api/production-users - Obtener todos los usuarios de producción
  // POST eliminado - Los usuarios de producción se crean desde el módulo de branches

router.route('/:id')
  .get(getProductionUserById)         // GET /api/production-users/:id - Obtener usuario por ID
  .put(updateProductionUser)          // PUT /api/production-users/:id - Actualizar usuario
  .delete(deleteProductionUser);      // DELETE /api/production-users/:id - Eliminar usuario

// Rutas para activar/desactivar usuarios de producción
router.put('/:id/activate', activateProductionUser);     // PUT /api/production-users/:id/activate - Activar usuario
router.put('/:id/deactivate', deactivateProductionUser); // PUT /api/production-users/:id/deactivate - Desactivar usuario

export default router;