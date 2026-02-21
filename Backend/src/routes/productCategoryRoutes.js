import express from "express";
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory,
  deactivateProductCategory,
  activateProductCategory,
  deleteProductCategory,
  getCategoriesByCompany,
} from "../controllers/productCategoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Ruta para clientes: obtener categorías por empresa
router.get("/by-company", protect, getCategoriesByCompany);

// Rutas protegidas con autenticación
router.get("/", protect, getAllProductCategories);
router.get("/:id", protect, getProductCategoryById);

router.post("/", protect, createProductCategory);

router.put("/:id", protect, updateProductCategory);
router.patch("/:id/activate", protect, activateProductCategory);
router.patch("/:id/deactivate", protect, deactivateProductCategory);

router.delete("/:id", protect, deleteProductCategory);

export default router;
