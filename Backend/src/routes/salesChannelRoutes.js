import { Router } from 'express';
import {
  getAllSalesChannels,
  getSalesChannelById,
  createSalesChannel,
  updateSalesChannel,
  deleteSalesChannel
} from '../controllers/salesChannelController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para canales de venta
router.route('/')
  .get(getAllSalesChannels)        // GET /api/sales-channels - Obtener todos los canales
  .post(createSalesChannel);       // POST /api/sales-channels - Crear nuevo canal

router.route('/:id')
  .get(getSalesChannelById)        // GET /api/sales-channels/:id - Obtener canal por ID
  .put(updateSalesChannel)         // PUT /api/sales-channels/:id - Actualizar canal
  .delete(deleteSalesChannel);     // DELETE /api/sales-channels/:id - Eliminar canal

export default router;