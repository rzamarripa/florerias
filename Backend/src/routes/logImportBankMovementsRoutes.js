import express from "express";
import {
  getTodayImportBankMovements,
  getBankAccountsImportStatusToday,
} from "../controllers/logImportBankMovementsController.js";
const router = express.Router();

router.get("/today", getTodayImportBankMovements);
router.get("/accounts-status-today", getBankAccountsImportStatusToday);

export default router;
