import express from "express";
import { paymentsByProviderController } from "../controllers/paymentsByProviderController.js";

const router = express.Router();

router.get("/", paymentsByProviderController.getAll);
router.get("/bank-layouts", paymentsByProviderController.getBankLayouts);
router.get("/:id", paymentsByProviderController.getById);
router.post("/", paymentsByProviderController.create);
router.post("/group-invoices", paymentsByProviderController.groupInvoicesByProvider);
router.post("/generate-individual-references", paymentsByProviderController.generateIndividualInvoiceReferences);
router.delete("/revert-layout/:layoutId", paymentsByProviderController.revertBankLayout);
router.put("/:id", paymentsByProviderController.update);
router.delete("/:id", paymentsByProviderController.delete);

export default router; 