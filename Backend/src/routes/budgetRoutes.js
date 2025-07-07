import express from "express";
import {
  calculateParentTotal,
  createBudget,
  deleteBudget,
  getBudgetTreeData,
  getBudgetsByCategory,
  getBudgetsByMonth,
  getMonthlyBudgetByBranch,
  updateBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

router.get("/tree", getBudgetTreeData);

router.get("/month/:month", getBudgetsByMonth);

router.get("/category/:categoryId", getBudgetsByCategory);

router.get("/branch/:branchId/month/:month", getMonthlyBudgetByBranch);

router.get("/total/:parentType/:parentId", calculateParentTotal);

router.post("/", createBudget);

router.put("/:id", updateBudget);

router.delete("/:id", deleteBudget);

export default router;
