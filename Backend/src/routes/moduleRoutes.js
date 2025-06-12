import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createModule,
  getAllModules,
  getModuleById,
  getModulesByPage,
  updateModule,
  deleteModule,
  activateModule,
  deleteModulePermanently
} from '../controllers/moduleController.js';

const router = express.Router();

// Aplicar protección a todas las rutas
router.use(protect);

// Rutas principales CRUD
router.route('/')
  .get(getAllModules)
  .post(authorize(['SuperAdmin', 'Admin']), createModule);

// Ruta para obtener módulos por página
router.get('/page/:pageId', getModulesByPage);

router.route('/:id')
  .get(getModuleById)
  .put(authorize(['SuperAdmin', 'Admin']), updateModule)
  .delete(authorize(['SuperAdmin', 'Admin']), deleteModule);

// Rutas específicas para manejo de estado
router.put('/:id/activate', authorize(['SuperAdmin', 'Admin']), activateModule);

// Ruta para eliminación permanente (solo SuperAdmin)
router.delete('/:id/permanent', authorize(['SuperAdmin']), deleteModulePermanently);

export default router;