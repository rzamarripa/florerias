import { Router } from "express";
import {
  createReview,
  getReviewsByOrder,
  getAverageRatings,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Public route - no auth required
router.get("/products/averages", getAverageRatings);

router.use(protect);

router.post("/", createReview);
router.get("/order/:orderId", getReviewsByOrder);

export default router;
