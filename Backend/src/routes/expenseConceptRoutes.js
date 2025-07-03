import express from "express";
import {
  activeExpenseConcept,
  createExpenseConcept,
  deleteExpenseConcept,
  getAll,
  getAllExpenseConcepts,
  getById,
  updateExpenseConcept,
  getExpenseConceptsByDepartment,
} from "../controllers/expenseConceptController.js";

const router = express.Router();

router.get("/", getAllExpenseConcepts);
router.get("/all", getAll);
router.get("/:id", getById);
router.get("/department/:departmentId", getExpenseConceptsByDepartment);
router.post("/", createExpenseConcept);
router.put("/:id", updateExpenseConcept);
router.delete("/:id", deleteExpenseConcept);
router.put("/:id/active", activeExpenseConcept);

export default router;
