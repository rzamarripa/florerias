import express from "express";
import {
  activeDepartment,
  createDepartment,
  deleteDepartment,
  getAll,
  getAllDepartments,
  getById,
  updateDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", getAllDepartments);
router.get("/all", getAll);
router.get("/:id", getById);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);
router.put("/:id/active", activeDepartment);

export default router;
