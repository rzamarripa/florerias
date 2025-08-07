import express from "express";
import {
  createBudget,
  deleteBudget,
  getBudgetTree,
  updateBudget,
  getBudgetByBranch,
  getBudgetByCompanyForBranches,
  validatePackageBudgetByExpenseConcept
} from "../controllers/budgetController.js";

const router = express.Router();

router.get("/tree", getBudgetTree);
router.get("/by-branch", getBudgetByBranch);
router.get("/by-company-branches", getBudgetByCompanyForBranches);
router.get("/validate-package/:packageId", validatePackageBudgetByExpenseConcept);

router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
