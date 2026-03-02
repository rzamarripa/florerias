import { Router } from "express";
import { getWhatsappConfig, upsertWhatsappConfig } from "../controllers/whatsappCompanyConfigController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// GET /whatsapp-config/company/:companyId — Obtener configuración WhatsApp
router.get("/company/:companyId", getWhatsappConfig);

// PUT /whatsapp-config/company/:companyId — Upsert configuración WhatsApp
router.put("/company/:companyId", upsertWhatsappConfig);

export default router;
