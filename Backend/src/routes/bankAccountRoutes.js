import express from "express";
import {
  activateBankAccount,
  createBankAccount,
  deleteBankAccount,
  getActiveBankAccountsCount,
  getAllBankAccounts,
  getBankAccountById,
  updateBankAccount,
} from "../controllers/bankAccountController.js";

const router = express.Router();

router.get("/", getAllBankAccounts);
router.get("/count/active", getActiveBankAccountsCount);
router.get("/:id", getBankAccountById);
router.post("/", createBankAccount);
router.put("/:id", updateBankAccount);
router.delete("/:id", deleteBankAccount);
router.put("/:id/active", activateBankAccount);

export default router;
