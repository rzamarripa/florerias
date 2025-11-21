import express from "express";
import {
  getAllCashRegisters,
  getCashRegisterById,
  createCashRegister,
  updateCashRegister,
  toggleActiveCashRegister,
  toggleOpenCashRegister,
  deleteCashRegister,
  getCashiersAndManagersByAdmin,
  getManagerBranch,
  getUserCashRegister,
  registerExpense,
  getCashRegisterSummary,
  closeCashRegister,
  getOpenCashRegistersByBranch,
  getSocialMediaCashRegisters,
} from "../controllers/cashRegisterController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas GET
router.get("/", getAllCashRegisters);
router.get("/social-media", getSocialMediaCashRegisters);
router.get("/user/cash-register", getUserCashRegister);
router.get("/admin/:adminId/employees", getCashiersAndManagersByAdmin);
router.get("/manager/:managerId/branch", getManagerBranch);
router.get("/branch/:branchId/open", getOpenCashRegistersByBranch);
router.get("/:id/summary", getCashRegisterSummary);
router.get("/:id", getCashRegisterById);

// Rutas POST
router.post("/", createCashRegister);
router.post("/:id/expense", registerExpense);
router.post("/:id/close", closeCashRegister);

// Rutas PUT
router.put("/:id", updateCashRegister);
router.put("/:id/toggle-active", toggleActiveCashRegister);
router.put("/:id/toggle-open", toggleOpenCashRegister);

// Rutas DELETE
router.delete("/:id", deleteCashRegister);

export default router;
