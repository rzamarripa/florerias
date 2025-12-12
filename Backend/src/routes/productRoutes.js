import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
  deactivateProduct,
  getProductStats
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para productos
router.route('/')
  .get(getAllProducts)        // GET /api/products - Obtener todos los productos
  .post(createProduct);       // POST /api/products - Crear nuevo producto

router.route('/:id')
  .get(getProductById)        // GET /api/products/:id - Obtener producto por ID
  .put(updateProduct)         // PUT /api/products/:id - Actualizar producto
  .delete(deleteProduct);     // DELETE /api/products/:id - Eliminar producto

// Rutas para activar/desactivar productos
router.put('/:id/activate', activateProduct);     // PUT /api/products/:id/activate - Activar producto
router.put('/:id/deactivate', deactivateProduct); // PUT /api/products/:id/deactivate - Desactivar producto

// Ruta para obtener estadísticas de ventas
router.get('/:id/stats', getProductStats);        // GET /api/products/:id/stats - Obtener estadísticas

export default router;
