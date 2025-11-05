import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para eventos
router.route('/')
  .get(getAllEvents)        // GET /api/events - Obtener todos los eventos
  .post(createEvent);       // POST /api/events - Crear nuevo evento

router.route('/:id')
  .get(getEventById)        // GET /api/events/:id - Obtener evento por ID
  .put(updateEvent)         // PUT /api/events/:id - Actualizar evento
  .delete(deleteEvent);     // DELETE /api/events/:id - Eliminar evento

export default router;
