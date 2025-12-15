import express from "express";
import {
  getAllPointsConfigs,
  createPointsConfig,
  getPointsConfigById,
  getPointsConfigByBranch,
  updatePointsConfig,
  deletePointsConfig,
  activatePointsConfig,
} from "../controllers/pointsConfigController.js";

const router = express.Router();

// GET routes
router.get("/", getAllPointsConfigs);
router.get("/:id", getPointsConfigById);
router.get("/branch/:branchId", getPointsConfigByBranch);

// POST routes
router.post("/", createPointsConfig);

// PUT routes
router.put("/:id", updatePointsConfig);
router.put("/:id/activate", activatePointsConfig);

// DELETE routes
router.delete("/:id", deletePointsConfig);

export default router;
