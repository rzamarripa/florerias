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
  getRedesUsers,
  getRedesUserBranches,
  updateCompanyBranches,
  getMyCompany,
  getCompanyByBranchId,
  getUserCompany,
} from "../controllers/companyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas con autenticación
router.get("/", protect, getAllCompanies);
router.get("/administrators/list", protect, getAdministrators);
router.get("/redes/list", protect, getRedesUsers);
router.get("/redes/branches", protect, getRedesUserBranches);
router.get("/my-company", protect, getMyCompany);
router.get("/user-company", protect, getUserCompany);
router.get("/branch/:branchId", protect, getCompanyByBranchId);
router.get("/:id", protect, getCompanyById);

router.post("/", protect, createCompany);

router.put("/:id", protect, updateCompany);
router.put("/:id/activate", protect, activateCompany);
router.put("/:id/deactivate", protect, deactivateCompany);
router.put("/:id/branches", protect, updateCompanyBranches);

router.delete("/:id", protect, deleteCompany);

export default router;
