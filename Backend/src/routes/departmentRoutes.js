import express from "express";
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

// GET routes
router.get("/", getAllDepartments);
router.get("/:id", getDepartmentById);

// POST routes
router.post("/", createDepartment);

export default router;