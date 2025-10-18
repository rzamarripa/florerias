import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deactivateCompany,
  activateCompany,
  deleteCompany,
  getAdministrators,
  updateCompanyBranches,
  getMyCompany,
} from "../controllers/companyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas con autenticación
router.get("/", protect, getAllCompanies);
router.get("/administrators/list", protect, getAdministrators);
router.get("/my-company", protect, getMyCompany);
router.get("/:id", protect, getCompanyById);

router.post("/", protect, createCompany);

router.put("/:id", protect, updateCompany);
router.put("/:id/activate", protect, activateCompany);
router.put("/:id/deactivate", protect, deactivateCompany);
router.put("/:id/branches", protect, updateCompanyBranches);

router.delete("/:id", protect, deleteCompany);

export default router;
