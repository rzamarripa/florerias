import express from "express";
import {
  getAllPointsRewards,
  createPointsReward,
  getPointsRewardById,
  getPointsRewardsByBranch,
  updatePointsReward,
  deletePointsReward,
  activatePointsReward,
} from "../controllers/pointsRewardController.js";

const router = express.Router();

// GET routes
router.get("/", getAllPointsRewards);
router.get("/:id", getPointsRewardById);
router.get("/branch/:branchId", getPointsRewardsByBranch);

// POST routes
router.post("/", createPointsReward);

// PUT routes
router.put("/:id", updatePointsReward);
router.put("/:id/activate", activatePointsReward);

// DELETE routes
router.delete("/:id", deletePointsReward);

export default router;
