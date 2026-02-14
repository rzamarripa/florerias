import { Router } from 'express';
import {
  getAllNetworksUsers,
  getNetworksUserById,
  createNetworksUser,
  updateNetworksUser,
  deleteNetworksUser,
  activateNetworksUser,
  deactivateNetworksUser
} from '../controllers/networksUserController.js';

const router = Router();

// Middleware de autenticación (descomenta si tienes middleware de auth)
// const { protect } = require('../middleware/auth');

// Rutas para usuarios de redes
router.route('/')
  .get(getAllNetworksUsers)          // GET /api/networks-users - Obtener todos los usuarios de redes
  .post(createNetworksUser);         // POST /api/networks-users - Crear nuevo usuario de redes

router.route('/:id')
  .get(getNetworksUserById)          // GET /api/networks-users/:id - Obtener usuario por ID
  .put(updateNetworksUser)           // PUT /api/networks-users/:id - Actualizar usuario
  .delete(deleteNetworksUser);       // DELETE /api/networks-users/:id - Eliminar usuario

// Rutas para activar/desactivar usuarios de redes
router.put('/:id/activate', activateNetworksUser);     // PUT /api/networks-users/:id/activate - Activar usuario
router.put('/:id/deactivate', deactivateNetworksUser); // PUT /api/networks-users/:id/deactivate - Desactivar usuario

export default router;