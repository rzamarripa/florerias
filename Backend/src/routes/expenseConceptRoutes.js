import express from "express";
import {
  activeExpenseConcept,
  createExpenseConcept,
  deleteExpenseConcept,
  getAll,
  getAllExpenseConcepts,
  getById,
  updateExpenseConcept,
} from "../controllers/expenseConceptController.js";

const router = express.Router();

router.get("/", getAllExpenseConcepts);
router.get("/all", getAll);
router.get("/:id", getById);
router.post("/", createExpenseConcept);
router.put("/:id", updateExpenseConcept);
router.delete("/:id", deleteExpenseConcept);
router.put("/:id/active", activeExpenseConcept);

export default router;
