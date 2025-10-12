import { Router } from 'express';
import {
  getAllProductLists,
  getProductListById,
  createProductList,
  updateProductList,
  updateProductListStatus,
  deleteProductList
} from '../controllers/productListController.js';

const router = Router();

// Rutas para listas de productos
router.route('/')
  .get(getAllProductLists)        // GET /api/product-lists - Obtener todas las listas
  .post(createProductList);       // POST /api/product-lists - Crear nueva lista

router.route('/:id')
  .get(getProductListById)        // GET /api/product-lists/:id - Obtener lista por ID
  .put(updateProductList)         // PUT /api/product-lists/:id - Actualizar lista
  .delete(deleteProductList);     // DELETE /api/product-lists/:id - Eliminar lista

// Ruta para actualizar estado
router.put('/:id/status', updateProductListStatus); // PUT /api/product-lists/:id/status - Actualizar estado

export default router;
