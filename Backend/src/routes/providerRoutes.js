import express from "express";
import {
  getAll,
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  activateProvider,
} from "../controllers/providerController.js";

const router = express.Router();

router.get("/all", getAll);

router.get("/", getAllProviders);

router.post("/", createProvider);

router.put("/:id", updateProvider);
                                    
router.delete("/:id", deleteProvider);

router.patch("/activate/:id", activateProvider);

export default router; 