import express from "express";
import { getImportStatusByAccount } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/import-status", getImportStatusByAccount);

export default router;
