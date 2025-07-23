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
  getAllBanks,
  getAllBranches,
  getBankAccountsByBank,
  getProvidersByRfcs,
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

router.get("/banks", getAllBanks);

router.get("/branches", getAllBranches);

router.get("/bank-accounts/by-bank/:bankId", getBankAccountsByBank);

router.get("/by-rfcs", getProvidersByRfcs);

export default router; 