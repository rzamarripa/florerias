import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getConfigByBranch,
  createConfig,
  updateHeader,
  updateTemplate,
  updateColors,
  updateTypography,
  updateFeaturedElements,
  getManagerConfig
} from '../controllers/ecommerceConfigController.js';

const router = Router();

// Rutas protegidas - requieren autenticación
router.use(protect);

// Obtener configuración del gerente actual
router.get('/manager', getManagerConfig);

// Obtener configuración por sucursal
router.get('/branch/:branchId', getConfigByBranch);

// Crear nueva configuración
router.post('/', createConfig);

// Actualizar secciones específicas
router.patch('/:id/header', updateHeader);
router.patch('/:id/template', updateTemplate);
router.patch('/:id/colors', updateColors);
router.patch('/:id/typography', updateTypography);
router.patch('/:id/featured', updateFeaturedElements);

export default router;