import express from "express";
import {
  getRoleVisibilityStructure,
  updateRoleVisibility,
  checkAccess,
  getAllStructure,
} from "../controllers/roleVisibilityController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Obtener estructura jerárquica completa
router.get("/structure", protect, getAllStructure);

// Obtener estructura jerárquica de visibilidad para un rol
router.get("/:roleId/structure", protect, getRoleVisibilityStructure);

// Actualizar visibilidad de un rol
router.put("/:roleId", protect, updateRoleVisibility);

// Verificar acceso a una entidad específica
router.get("/:roleId/check-access", protect, checkAccess);

export default router;
