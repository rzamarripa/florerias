import express from "express";
import {
  getAll,
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  activateProvider,
  getStatesByCountryId,
  getMunicipalitiesByStateId,
} from "../controllers/providerController.js";

const router = express.Router();

router.get("/all", getAll);

router.get("/", getAllProviders);

router.post("/", createProvider);

router.put("/:id", updateProvider);
                                    
router.delete("/:id", deleteProvider);

router.patch("/activate/:id", activateProvider);

router.get("/states/by-country/:countryId", getStatesByCountryId);

router.get("/municipalities/by-state/:stateId", getMunicipalitiesByStateId);

export default router; 