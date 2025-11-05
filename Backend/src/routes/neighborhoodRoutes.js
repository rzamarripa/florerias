import { Router } from 'express';
import {
  getAllNeighborhoods,
  getNeighborhoodById,
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood
} from '../controllers/neighborhoodController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para colonias
router.route('/')
  .get(getAllNeighborhoods)        // GET /api/neighborhoods - Obtener todas las colonias
  .post(createNeighborhood);       // POST /api/neighborhoods - Crear nueva colonia

router.route('/:id')
  .get(getNeighborhoodById)        // GET /api/neighborhoods/:id - Obtener colonia por ID
  .put(updateNeighborhood)         // PUT /api/neighborhoods/:id - Actualizar colonia
  .delete(deleteNeighborhood);     // DELETE /api/neighborhoods/:id - Eliminar colonia

export default router;
