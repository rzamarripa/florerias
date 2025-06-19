import express from "express";
import {
  getAllBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  activateBankAccount,
} from "../controllers/bankAccountController.js";

const router = express.Router();

router.get("/", getAllBankAccounts);
router.get("/:id", getBankAccountById);
router.post("/", createBankAccount);
router.put("/:id", updateBankAccount);
router.delete("/:id", deleteBankAccount);
router.put("/:id/active", activateBankAccount);

export default router;
