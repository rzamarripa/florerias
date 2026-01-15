import express from "express";
import {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  activateClient,
  addPointsToClient,
  usePointsFromClient,
  addCommentToClient,
  getClientPointsHistory,
  getAvailableRewards,
  redeemReward,
  verifyRewardCode,
  getClientRewards,
} from "../controllers/clientController.js";

const router = express.Router();

// GET routes
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.get("/:id/points-history", getClientPointsHistory);
router.get("/:id/available-rewards", getAvailableRewards);
router.get("/:id/rewards", getClientRewards);

// POST routes
router.post("/", createClient);

// PUT routes
router.put("/:id", updateClient);
router.put("/:id/activate", activateClient);
router.put("/:id/add-points", addPointsToClient);
router.put("/:id/use-points", usePointsFromClient);
router.put("/:id/add-comment", addCommentToClient);

// POST routes for rewards
router.post("/:id/redeem-reward", redeemReward);
router.post("/:id/verify-reward-code", verifyRewardCode);

// DELETE routes
router.delete("/:id", deleteClient);

export default router;