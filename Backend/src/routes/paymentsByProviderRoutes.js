import express from "express";
import { paymentsByProviderController } from "../controllers/paymentsByProviderController.js";

const router = express.Router();

router.get("/", paymentsByProviderController.getAll);
router.get("/:id", paymentsByProviderController.getById);
router.post("/", paymentsByProviderController.create);
router.post("/group-invoices", paymentsByProviderController.groupInvoicesByProvider);
router.put("/:id", paymentsByProviderController.update);
router.delete("/:id", paymentsByProviderController.delete);

export default router; 