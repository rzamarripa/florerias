import express from "express";
import {
  createProvider,
  getAllProviders,
  getProviderById,
  updateProvider,
  deactivateProvider,
  activateProvider,
  deleteProvider,
} from "../controllers/providerController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas con autenticación
router.get("/", protect, getAllProviders);
router.get("/:id", protect, getProviderById);

router.post("/", protect, createProvider);

router.put("/:id", protect, updateProvider);
router.put("/:id/activate", protect, activateProvider);
router.put("/:id/deactivate", protect, deactivateProvider);

router.delete("/:id", protect, deleteProvider);

export default router;
