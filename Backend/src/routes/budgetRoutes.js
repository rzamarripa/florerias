import express from "express";
import {
  createBudget,
  deleteBudget,
  getBudgetTree,
  updateBudget,
  getBudgetByBranch,
  getBudgetByCompanyForBranches
} from "../controllers/budgetController.js";

const router = express.Router();

router.get("/tree", getBudgetTree);
router.get("/by-branch", getBudgetByBranch);
router.get("/by-company-branches", getBudgetByCompanyForBranches);

router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
