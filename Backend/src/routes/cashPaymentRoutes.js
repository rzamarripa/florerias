import express from "express";
import {
    getAllCashPayments,
    getCashPaymentById,
    createCashPayment,
    updateCashPayment,
    deleteCashPayment,
    authorizeCashPaymentInPackage,
    rejectCashPaymentInPackage,
    addCashPaymentToPackage
} from "../controllers/cashPaymentController.js";

const router = express.Router();

router.get("/", getAllCashPayments);
router.get("/:id", getCashPaymentById);
router.post("/", createCashPayment);
router.put("/:id", updateCashPayment);
router.delete("/:id", deleteCashPayment);
router.post("/authorize-in-package", authorizeCashPaymentInPackage);
router.post("/reject-in-package", rejectCashPaymentInPackage);
router.post("/add-to-package", addCashPaymentToPackage);

export default router; 