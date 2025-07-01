import express from "express";
import {
  getUserVisibilityStructure,
  updateUserVisibility,
  checkAccess,
  getAllStructure,
  getUserVisibilityForSelects,
  testBranchBrandRelations,
} from "../controllers/roleVisibilityController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/structure", protect, getAllStructure);

router.get("/:userId/structure", protect, getUserVisibilityStructure);

router.get("/:userId/selects", protect, getUserVisibilityForSelects);

router.put("/:userId", protect, updateUserVisibility);

router.get("/:userId/check-access", protect, checkAccess);

// Ruta de prueba para verificar relaciones marca-sucursal
router.get("/test/branch-brand/:brandId", protect, testBranchBrandRelations);

export default router;
