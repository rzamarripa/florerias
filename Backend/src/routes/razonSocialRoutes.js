import express from "express";
import {
  getAllRazonesSociales,
  createRazonSocial,
  updateRazonSocial,
  deleteRazonSocial,
} from "../controllers/razonSocialController.js";

const router = express.Router();

router.get("/", getAllRazonesSociales);
router.post("/", createRazonSocial);
router.put("/:id", updateRazonSocial);
router.delete("/:id", deleteRazonSocial);

export default router;
