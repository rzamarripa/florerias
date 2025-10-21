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
  getUserCashRegister,
} from "../controllers/cashRegisterController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas GET
router.get("/", getAllCashRegisters);
router.get("/user/cash-register", getUserCashRegister);
router.get("/admin/:adminId/employees", getCashiersAndManagersByAdmin);
router.get("/:id", getCashRegisterById);

// Rutas POST
router.post("/", createCashRegister);

// Rutas PUT
router.put("/:id", updateCashRegister);
router.put("/:id/toggle-active", toggleActiveCashRegister);
router.put("/:id/toggle-open", toggleOpenCashRegister);

// Rutas DELETE
router.delete("/:id", deleteCashRegister);

export default router;
