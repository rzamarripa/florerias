import { Router } from 'express';
import {
  getAllBuys,
  getBuyById,
  createBuy,
  updateBuy,
  deleteBuy
} from '../controllers/buyController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para compras
router.route('/')
  .get(getAllBuys)        // GET /api/buys - Obtener todas las compras
  .post(createBuy);       // POST /api/buys - Crear nueva compra

router.route('/:id')
  .get(getBuyById)        // GET /api/buys/:id - Obtener compra por ID
  .put(updateBuy)         // PUT /api/buys/:id - Actualizar compra
  .delete(deleteBuy);     // DELETE /api/buys/:id - Eliminar compra

export default router;
