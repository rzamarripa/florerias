import express from "express";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas con autenticación
router.get("/", protect, getAllExpenses);
router.get("/:id", protect, getExpenseById);

router.post("/", protect, createExpense);

router.put("/:id", protect, updateExpense);

router.delete("/:id", protect, deleteExpense);

export default router;
