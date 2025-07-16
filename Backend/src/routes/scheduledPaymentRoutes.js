import express from "express";
import { protect } from "../middleware/auth.js";
import { schedulePayment, getScheduledPaymentByPackage } from "../controllers/scheduledPaymentController.js";

const router = express.Router();

// POST - Programar un pago
router.post("/", protect, schedulePayment);

// GET - Obtener pago programado por paquete
router.get("/by-package/:packageId", protect, getScheduledPaymentByPackage);

export default router; 