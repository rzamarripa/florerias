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
} from "../controllers/clientController.js";

const router = express.Router();

// GET routes
router.get("/", getAllClients);
router.get("/:id", getClientById);

// POST routes
router.post("/", createClient);

// PUT routes
router.put("/:id", updateClient);
router.put("/:id/activate", activateClient);
router.put("/:id/add-points", addPointsToClient);
router.put("/:id/use-points", usePointsFromClient);
router.put("/:id/add-comment", addCommentToClient);

// DELETE routes
router.delete("/:id", deleteClient);

export default router;