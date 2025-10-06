import { Router } from 'express';
import {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  updateMaterialStatus,
  deleteMaterial
} from '../controllers/materialController.js';

const router = Router();

// Rutas para materiales
router.route('/')
  .get(getAllMaterials)        // GET /api/materials - Obtener todos los materiales
  .post(createMaterial);       // POST /api/materials - Crear nuevo material

router.route('/:id')
  .get(getMaterialById)        // GET /api/materials/:id - Obtener material por ID
  .put(updateMaterial)         // PUT /api/materials/:id - Actualizar material
  .delete(deleteMaterial);     // DELETE /api/materials/:id - Eliminar material

// Ruta para actualizar estado
router.put('/:id/status', updateMaterialStatus); // PUT /api/materials/:id/status - Actualizar estado

export default router;
