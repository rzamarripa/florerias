import express from "express";
import { fixBudgetIndexes } from "../controllers/fixIndexesController.js";

const router = express.Router();

router.post("/fix-budget-indexes", fixBudgetIndexes);

export default router;
