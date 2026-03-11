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
import { protect } from '../middleware/auth.js';

const router = Router();

// Rutas para usuarios de redes
router.route('/')
  .get(protect, getAllNetworksUsers)          // GET /api/networks-users - Obtener todos los usuarios de redes
  .post(protect, createNetworksUser);         // POST /api/networks-users - Crear nuevo usuario de redes

router.route('/:id')
  .get(protect, getNetworksUserById)          // GET /api/networks-users/:id - Obtener usuario por ID
  .put(protect, updateNetworksUser)           // PUT /api/networks-users/:id - Actualizar usuario
  .delete(protect, deleteNetworksUser);       // DELETE /api/networks-users/:id - Eliminar usuario

// Rutas para activar/desactivar usuarios de redes
router.put('/:id/activate', protect, activateNetworksUser);     // PUT /api/networks-users/:id/activate - Activar usuario
router.put('/:id/deactivate', protect, deactivateNetworksUser); // PUT /api/networks-users/:id/deactivate - Desactivar usuario

export default router;
