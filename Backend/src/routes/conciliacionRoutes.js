import express from 'express';
import {
  getFacturasParaConciliacion,
  getMovimientosBancariosParaConciliacion,
  getProviderGroupsParaConciliacion,
  conciliacionAutomatica,
  conciliacionManual,
  conciliacionDirecta,
  conciliacionDirectaProvider,
  cerrarConciliacion
} from '../controllers/conciliacionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/facturas', protect, getFacturasParaConciliacion);
router.get('/movimientos', protect, getMovimientosBancariosParaConciliacion);
router.get('/provider-groups', protect, getProviderGroupsParaConciliacion);

router.post('/automatica', protect, conciliacionAutomatica);
router.post('/manual', protect, conciliacionManual);
router.post('/directa', protect, conciliacionDirecta);
router.post('/directa-provider', protect, conciliacionDirectaProvider);
router.post('/cerrar', protect, cerrarConciliacion);

export default router; 