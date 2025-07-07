import express from "express";
import {
  activeCategory,
  createCategory,
  deleteCategory,
  getAll,
  getAllCategories,
  updateCategory,
  toggleHasRoutes,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/all", getAll);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.put("/:id/active", activeCategory);
router.patch("/:id/hasRoutes", toggleHasRoutes);

export default router;
