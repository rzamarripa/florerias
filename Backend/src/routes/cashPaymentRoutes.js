import express from "express";
import {
    getAllCashPayments,
    getCashPaymentById,
    createCashPayment,
    updateCashPayment,
    deleteCashPayment,
} from "../controllers/cashPaymentController.js";

const router = express.Router();

router.get("/", getAllCashPayments);
router.get("/:id", getCashPaymentById);
router.post("/", createCashPayment);
router.put("/:id", updateCashPayment);
router.delete("/:id", deleteCashPayment);

export default router; 