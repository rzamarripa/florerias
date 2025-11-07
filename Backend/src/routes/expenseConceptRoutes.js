import express from "express";
import {
  createExpenseConcept,
  getAllExpenseConcepts,
  getExpenseConceptById,
  updateExpenseConcept,
  deactivateExpenseConcept,
  activateExpenseConcept,
  deleteExpenseConcept,
} from "../controllers/expenseConceptController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas con autenticación
router.get("/", protect, getAllExpenseConcepts);
router.get("/:id", protect, getExpenseConceptById);

router.post("/", protect, createExpenseConcept);

router.put("/:id", protect, updateExpenseConcept);
router.put("/:id/activate", protect, activateExpenseConcept);
router.put("/:id/deactivate", protect, deactivateExpenseConcept);

router.delete("/:id", protect, deleteExpenseConcept);

export default router;
