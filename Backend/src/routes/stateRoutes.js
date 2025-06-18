import express from "express";
import {
  activeState,
  createState,
  deleteState,
  getAll,
  getAllStates,
  getByCountryId,
  getById,
  updateState,
} from "../controllers/stateController.js";

const router = express.Router();

router.get("/", getAllStates);
router.get("/all", getAll);
router.get("/country/:countryId", getByCountryId);
router.get("/:id", getById);
router.post("/", createState);
router.put("/:id", updateState);
router.delete("/:id", deleteState);
router.put("/:id/active", activeState);

export default router;
