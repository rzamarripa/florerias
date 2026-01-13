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
  getManagerConfig,
  syncItemsStock,
  updateItemsStock
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
router.patch('/:id/items-stock', syncItemsStock);  // Nueva ruta para sincronizar productos

// Actualizar productos del catálogo (itemsStock) - DEPRECATED
router.post('/items-stock', updateItemsStock);

export default router;