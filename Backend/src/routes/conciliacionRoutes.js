import express from 'express';
import {
  getFacturasParaConciliacion,
  getMovimientosBancariosParaConciliacion,
  conciliacionAutomatica,
  conciliacionManual,
  cerrarConciliacion
} from '../controllers/conciliacionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/facturas', protect, getFacturasParaConciliacion);
router.get('/movimientos', protect, getMovimientosBancariosParaConciliacion);

router.post('/automatica', protect, conciliacionAutomatica);
router.post('/manual', protect, conciliacionManual);
router.post('/cerrar', protect, cerrarConciliacion);

export default router; 