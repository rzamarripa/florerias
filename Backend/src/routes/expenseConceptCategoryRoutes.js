import express from "express";
import {
  activateExpenseConceptCategory,
  createExpenseConceptCategory,
  deleteExpenseConceptCategory,
  getAll,
  getAllExpenseConceptCategories,
  updateExpenseConceptCategory,
} from "../controllers/expenseConceptCategoryController.js";

const router = express.Router();

router.get("/", getAllExpenseConceptCategories);
router.get("/all", getAll);
router.post("/", createExpenseConceptCategory);
router.put("/:id", updateExpenseConceptCategory);
router.delete("/:id", deleteExpenseConceptCategory);
router.put("/:id/active", activateExpenseConceptCategory);

export default router;
