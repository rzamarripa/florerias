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
  getAvailableManagers,
  getUserBranches,
  getCashiersByBranch,
  getBranchesForRedesUser,
  getDailyDeliveryStatus,
} from "../controllers/branchController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas GET
router.get("/", getAllBranches);
router.get("/user/branches", getUserBranches);
router.get("/user/redes/branches", getBranchesForRedesUser);
router.get("/available-managers", getAvailableManagers);
router.get("/:id/cashiers", getCashiersByBranch);
router.get("/:id/delivery-status", getDailyDeliveryStatus);
router.get("/:id", getBranchById);

// Rutas POST
router.post("/", createBranch);
router.post("/:id/employees", addEmployeesToBranch);

// Rutas PUT
router.put("/:id", updateBranch);
router.put("/:id/activate", activateBranch);
router.put("/:id/deactivate", deactivateBranch);

// Rutas DELETE
router.delete("/:id", deleteBranch);
router.delete("/:id/employees/:employeeId", removeEmployeeFromBranch);

export default router;
