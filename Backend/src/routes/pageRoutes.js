import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createPage,
  getAllPages,
  getPageById,
  updatePage,
  deletePage,
  activatePage,
  addModuleToPage,
  removeModuleFromPage
} from '../controllers/pageController.js';

const router = express.Router();

// Aplicar protección a todas las rutas
router.use(protect);

// Rutas principales CRUD
router.route('/')
  .get(getAllPages)
  .post(authorize(['SuperAdmin', 'Admin']), createPage);

router.route('/:id')
  .get(getPageById)
  .put(authorize(['SuperAdmin', 'Admin']), updatePage)
  .delete(authorize(['SuperAdmin', 'Admin']), deletePage);

// Rutas específicas para manejo de estado
router.put('/:id/activate', authorize(['SuperAdmin', 'Admin']), activatePage);

// Rutas para manejo de módulos en páginas
router.route('/:id/modules')
  .post(authorize(['SuperAdmin', 'Admin']), addModuleToPage);

router.delete('/:id/modules/:moduleId', authorize(['SuperAdmin', 'Admin']), removeModuleFromPage);

export default router;