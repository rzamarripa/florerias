import express from "express";
import {
  sendResetCode,
  verifyResetCode,
  resetPassword,
  checkResetStatus
} from "../controllers/passwordResetController.js";

const router = express.Router();

// Send reset code to email
router.post("/send-code", sendResetCode);

// Verify reset code
router.post("/verify-code", verifyResetCode);

// Reset password with verified code
router.post("/reset-password", resetPassword);

// Check if user has valid reset code (optional)
router.get("/check-status", checkResetStatus);

export default router;