import express from "express";
import { 
  getAllExpenseConcepts, 
  getBudgetByExpenseConceptId,
  getPaidByExpenseConceptId,
  getPendingByExpenseConceptId
} from "../controllers/expenseConceptBudgetController.js";

const router = express.Router();

router.get("/expense-concepts", getAllExpenseConcepts);
router.get("/budget-by-concept", getBudgetByExpenseConceptId);
router.get("/paid-by-concept", getPaidByExpenseConceptId);
router.get("/pending-by-concept", getPendingByExpenseConceptId);

export default router; 