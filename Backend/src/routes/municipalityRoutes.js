import express from "express";
import {
  activeMunicipality,
  createMunicipality,
  deleteMunicipality,
  getAll,
  getAllMunicipalities,
  getById,
  getByStateId,
  updateMunicipality,
} from "../controllers/municipalityController.js";

const router = express.Router();

router.get("/", getAllMunicipalities);
router.get("/all", getAll);
router.get("/state/:stateId", getByStateId);
router.get("/:id", getById);
router.post("/", createMunicipality);
router.put("/:id", updateMunicipality);
router.delete("/:id", deleteMunicipality);
router.put("/:id/active", activeMunicipality);

export default router;
