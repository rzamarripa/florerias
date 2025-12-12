import { Router } from 'express';
import {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  updateUnitStatus,
  deleteUnit
} from '../controllers/unitController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para unidades
router.route('/')
  .get(getAllUnits)        // GET /api/units - Obtener todas las unidades
  .post(createUnit);       // POST /api/units - Crear nueva unidad

router.route('/:id')
  .get(getUnitById)        // GET /api/units/:id - Obtener unidad por ID
  .put(updateUnit)         // PUT /api/units/:id - Actualizar unidad
  .delete(deleteUnit);     // DELETE /api/units/:id - Eliminar unidad

// Ruta para actualizar estado
router.put('/:id/status', updateUnitStatus); // PUT /api/units/:id/status - Actualizar estado

export default router;
