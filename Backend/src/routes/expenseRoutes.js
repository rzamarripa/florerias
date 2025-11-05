import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas para gastos
router.route('/')
  .get(getAllExpenses)        // GET /api/expenses - Obtener todos los gastos
  .post(createExpense);       // POST /api/expenses - Crear nuevo gasto

router.route('/:id')
  .get(getExpenseById)        // GET /api/expenses/:id - Obtener gasto por ID
  .put(updateExpense)         // PUT /api/expenses/:id - Actualizar gasto
  .delete(deleteExpense);     // DELETE /api/expenses/:id - Eliminar gasto

export default router;
