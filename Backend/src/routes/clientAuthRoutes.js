import express from "express";
import { loginClient } from "../controllers/clientAuthController.js";

const router = express.Router();

// POST /api/client-auth/login
router.post("/login", loginClient);

export default router;
