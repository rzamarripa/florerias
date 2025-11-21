import express from 'express';
import { getDashboardData } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// GET /api/analytics/dashboard - Obtener datos completos del dashboard
router.get('/dashboard', getDashboardData);

export default router;
