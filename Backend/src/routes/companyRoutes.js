import express from "express";
import {
  activeCompany,
  createCompany,
  deleteCompany,
  getAll,
  getAllCompanies,
  updateCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.get("/", getAllCompanies);
router.get("/all", getAll);
router.post("/", createCompany);
router.put("/:id", updateCompany);
router.put("/:id/active", activeCompany);
router.delete("/:id/delete", deleteCompany);

export default router;
