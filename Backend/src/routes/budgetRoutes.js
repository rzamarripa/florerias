import express from "express";
import {
  createBudget,
  deleteBudget,
  getBudgetTree,
  updateBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

router.get("/tree", getBudgetTree);

router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
