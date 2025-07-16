import express from "express";
import { protect } from "../middleware/auth.js";
import { getAllCompanies } from "../controllers/companyController.js";

const router = express.Router();

// GET - Obtener todas las razones sociales activas
router.get("/all", protect, getAllCompanies);

export default router;
