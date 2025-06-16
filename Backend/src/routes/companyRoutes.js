import express from "express";
import {
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  activeCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.get("/", getAllCompanies);
router.post("/", createCompany);
router.put("/:id", updateCompany);
router.put("/:id/active", activeCompany);
router.delete("/:id/delete", deleteCompany);

export default router;