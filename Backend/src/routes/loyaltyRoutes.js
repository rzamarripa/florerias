import express from "express";
import {
  scanLoyaltyCard,
  syncPoints,
  registerLoyaltyCard,
  getLoyaltyCard,
  getQueueStats,
  retryJob,
  handleWebhook,
  processOrderLoyalty,
} from "../controllers/loyaltyController.js";

const router = express.Router();

/**
 * Rutas de Loyalty/Luyoa Integration
 *
 * Flujo principal:
 * 1. POST /scan - POS escanea QR, identifica cliente
 * 2. [Crear orden con cliente identificado]
 * 3. POST /sync - Encolar sincronización de puntos
 *
 * O usar el flujo simplificado:
 * 1. POST /scan - Identificar cliente
 * 2. [Crear orden]
 * 3. POST /process-order - Procesar puntos + encolar sync
 */

// === Endpoints principales ===

// Escanear código QR de tarjeta (identificar cliente)
router.post("/scan", scanLoyaltyCard);

// Encolar sincronización de puntos con Luyoa
router.post("/sync", syncPoints);

// Procesar orden completa (puntos + sync en un paso)
router.post("/process-order", processOrderLoyalty);

// === Gestión de tarjetas ===

// Registrar cliente en Luyoa
router.post("/register", registerLoyaltyCard);

// Obtener tarjeta de un cliente
router.get("/card/:clientId", getLoyaltyCard);

// === Administración de cola ===

// Estadísticas de la cola de sincronización
router.get("/queue/stats", getQueueStats);

// Reintentar un job fallido
router.post("/queue/retry/:jobId", retryJob);

// === Webhooks ===

// Endpoint para webhooks de Luyoa (sin auth)
router.post("/webhook", handleWebhook);

export default router;
