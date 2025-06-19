import express from "express";
import multer from "multer";
import { importBankMovements } from "../controllers/bankMovementController.js";

const router = express.Router();
const upload = multer();

router.post("/import", upload.single("file"), importBankMovements);

export default router;
