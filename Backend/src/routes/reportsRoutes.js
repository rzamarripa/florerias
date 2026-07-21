import express from "express";
import {
  getSalesByProduct,
  getSalesByCategory,
} from "../controllers/reportsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/sales-by-product", getSalesByProduct);
router.get("/sales-by-category", getSalesByCategory);

export default router;
