import express from "express";
import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deactivateBranch,
  activateBranch,
  deleteBranch,
  addEmployeesToBranch,
  removeEmployeeFromBranch,
} from "../controllers/branchController.js";

const router = express.Router();

// Rutas públicas o protegidas según tu configuración de autenticación
router.get("/", getAllBranches);
router.get("/:id", getBranchById);

router.post("/", createBranch);

router.put("/:id", updateBranch);
router.put("/:id/activate", activateBranch);
router.put("/:id/deactivate", deactivateBranch);
router.put("/:id/employees", addEmployeesToBranch);

router.delete("/:id", deleteBranch);
router.delete("/:id/employees/:employeeId", removeEmployeeFromBranch);

export default router;
