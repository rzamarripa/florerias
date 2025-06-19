import express from "express";
import {
  activeBranch,
  createBranch,
  deleteBranch,
  getAll,
  getAllBranches,
  updateBranch,
  getStatesByCountryId,
  getMunicipalitiesByStateId,
} from "../controllers/branchController.js";

const router = express.Router();

router.get("/", getAllBranches);
router.get("/all", getAll);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);
router.put("/:id/active", activeBranch);

router.get("/states/by-country/:countryId", getStatesByCountryId);
router.get("/municipalities/by-state/:stateId", getMunicipalitiesByStateId);

export default router;
