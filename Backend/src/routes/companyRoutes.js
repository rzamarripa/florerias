import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deactivateCompany,
  activateCompany,
  deleteCompany,
  getDistributors,
  updateCompanyBranches,
} from "../controllers/companyController.js";

const router = express.Router();

// Rutas públicas o protegidas según tu configuración de autenticación
router.get("/", getAllCompanies);
router.get("/distributors/list", getDistributors);
router.get("/:id", getCompanyById);

router.post("/", createCompany);

router.put("/:id", updateCompany);
router.put("/:id/activate", activateCompany);
router.put("/:id/deactivate", deactivateCompany);
router.put("/:id/branches", updateCompanyBranches);

router.delete("/:id", deleteCompany);

export default router;
