import express from "express";
import {
  activeBrand,
  createBrand,
  deleteBrand,
  getAll,
  getAllBrands,
  getBrandsByCompany,
  updateBrand,
} from "../controllers/brandController.js";
import { uploadSingle } from "../middleware/multerUpload.js";

const router = express.Router();

router.get("/", getAllBrands);
router.get("/all", getAll);
router.get("/by-company/:companyId", getBrandsByCompany);
router.post("/", uploadSingle("logo"), createBrand);
router.put("/:id", uploadSingle("logo"), updateBrand);
router.put("/:id/active", activeBrand);
router.delete("/:id/delete", deleteBrand);

export default router;
