import express from "express";
import {
  activateBankAccount,
  createBankAccount,
  deleteBankAccount,
  getActiveBankAccountsCount,
  getAllBankAccounts,
  getBankAccountById,
  updateBankAccount,
  getBankAccountsByCompany,
} from "../controllers/bankAccountController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllBankAccounts);
router.get("/count/active", getActiveBankAccountsCount);
router.get("/:id", getBankAccountById);
router.post("/", createBankAccount);
router.put("/:id", updateBankAccount);
router.delete("/:id", deleteBankAccount);
router.put("/:id/active", activateBankAccount);

// GET - Obtener cuentas bancarias por companyId
router.get("/by-company/:companyId", protect, getBankAccountsByCompany);

export default router;
