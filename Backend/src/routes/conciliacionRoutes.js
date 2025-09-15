import express from 'express';
import {
  getFacturasParaConciliacion,
  getMovimientosBancariosParaConciliacion,
  getProviderGroupsParaConciliacion,
  getFacturasIndividualesParaConciliacion,
  getProviderGroupsConciliados,
  getFacturasIndividualesConciliadas,
  conciliacionAutomatica,
  conciliacionManual,
  conciliacionDirecta,
  conciliacionDirectaProvider,
  conciliacionConValidaciones,
  cerrarConciliacion,
  eliminarConciliacion
} from '../controllers/conciliacionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/facturas', protect, getFacturasParaConciliacion);
router.get('/facturas-individuales', protect, getFacturasIndividualesParaConciliacion);
router.get('/movimientos', protect, getMovimientosBancariosParaConciliacion);
router.get('/provider-groups', protect, getProviderGroupsParaConciliacion);

// Rutas para historial (elementos conciliados)
router.get('/provider-groups-conciliados', protect, getProviderGroupsConciliados);
router.get('/facturas-individuales-conciliadas', protect, getFacturasIndividualesConciliadas);

router.post('/automatica', protect, conciliacionAutomatica);
router.post('/manual', protect, conciliacionManual);
router.post('/directa', protect, conciliacionDirecta);
router.post('/directa-provider', protect, conciliacionDirectaProvider);
router.post('/con-validaciones', protect, conciliacionConValidaciones);
router.post('/cerrar', protect, cerrarConciliacion);
router.post('/eliminar', protect, eliminarConciliacion);

export default router; 