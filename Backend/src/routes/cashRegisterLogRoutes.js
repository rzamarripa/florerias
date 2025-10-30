import express from "express";
import {
  getAllCashRegisterLogs,
  getCashRegisterLogById,
  getUserCashRegisters,
} from "../controllers/cashRegisterLogController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas GET
router.get("/", getAllCashRegisterLogs);
router.get("/user/cash-registers", getUserCashRegisters);
router.get("/:id", getCashRegisterLogById);

export default router;
