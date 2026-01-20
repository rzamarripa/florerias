import express from "express";
import {
  generateDigitalCard,
  getDigitalCard,
  downloadAppleWallet,
  downloadGoogleWallet,
  updateCardPoints,
  getCardTransactions,
  getCardStatistics,
  deactivateCard,
  generateTemporaryQR,
  getCardsByBranch,
  updateQRUrls,
  updateHeroUrls,
} from "../controllers/digitalCardController.js";
import { DigitalCard } from "../models/DigitalCard.js";

const router = express.Router();

// Rutas para gestión de tarjetas digitales

// Generar o obtener tarjeta digital de un cliente
router.post("/generate/:clientId", generateDigitalCard);

// Obtener tarjeta digital de un cliente
router.get("/client/:clientId", getDigitalCard);

// Actualizar URLs del QR después de subir a Firebase
router.put("/update-qr-urls/:cardId", updateQRUrls);

// Actualizar URLs de la imagen hero después de subir a Firebase
router.put("/update-hero-urls/:cardId", updateHeroUrls);

// Obtener tarjeta digital pública (sin autenticación)
router.get("/public/:cardId", async (req, res) => {
  try {
    const { cardId } = req.params;
    
    const digitalCard = await DigitalCard.findById(cardId)
      .populate("clientId", "name lastName clientNumber phoneNumber email points")
      .populate("branchId", "name address");
    
    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta no encontrada",
      });
    }

    // Solo devolver información pública
    res.status(200).json({
      success: true,
      data: {
        _id: digitalCard._id,
        client: {
          name: digitalCard.clientId.name,
          lastName: digitalCard.clientId.lastName,
          clientNumber: digitalCard.clientId.clientNumber,
          phoneNumber: digitalCard.clientId.phoneNumber,
          email: digitalCard.clientId.email,
          points: digitalCard.clientId.points,
        },
        qrCode: digitalCard.qrCode,
        qrCodeUrl: digitalCard.qrCodeUrl,
        heroUrl: digitalCard.heroUrl,
        expiresAt: digitalCard.expiresAt,
        lastUpdated: digitalCard.lastUpdated,
        isActive: digitalCard.isActive,
        metadata: digitalCard.metadata,
        branch: {
          name: digitalCard.branchId.name,
          address: digitalCard.branchId.address,
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo tarjeta pública:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Descargar tarjeta en formato Apple Wallet
router.get("/download/apple/:cardId", downloadAppleWallet);

// Descargar tarjeta en formato Google Wallet
router.get("/download/google/:cardId", downloadGoogleWallet);

// Actualizar puntos en la tarjeta
router.put("/update-points/:cardId", updateCardPoints);

// Obtener transacciones de una tarjeta
router.get("/transactions/:cardId", getCardTransactions);

// Obtener estadísticas de uso de la tarjeta
router.get("/statistics/:cardId", getCardStatistics);

// Desactivar una tarjeta
router.put("/deactivate/:cardId", deactivateCard);

// Generar QR temporal para transacción
router.post("/temporary-qr/:clientId", generateTemporaryQR);

// Obtener todas las tarjetas de una sucursal
router.get("/branch/:branchId", getCardsByBranch);

// Rutas para actualizaciones en tiempo real (webhooks)

// Registrar dispositivo para push notifications (Apple Wallet)
router.post("/register-device", async (req, res) => {
  try {
    const { deviceId, passSerialNumber, pushToken } = req.body;
    
    // Buscar la tarjeta por serial number
    const digitalCard = await DigitalCard.findOne({ passSerialNumber });
    
    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta no encontrada",
      });
    }

    // Actualizar el push token
    if (!digitalCard.pushToken) {
      digitalCard.pushToken = {};
    }
    digitalCard.pushToken.apple = pushToken;
    
    // Registrar el dispositivo
    await digitalCard.addDevice(deviceId, "ios");
    
    res.status(200).json({
      success: true,
      message: "Dispositivo registrado",
    });
  } catch (error) {
    console.error("Error registrando dispositivo:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Desregistrar dispositivo
router.delete("/unregister-device", async (req, res) => {
  try {
    const { deviceId, passSerialNumber } = req.body;
    
    // TODO: Implementar lógica de desregistro
    
    res.status(200).json({
      success: true,
      message: "Dispositivo desregistrado",
    });
  } catch (error) {
    console.error("Error desregistrando dispositivo:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Obtener actualizaciones del pass (para Apple Wallet)
router.get("/pass/:passSerialNumber/updates", async (req, res) => {
  try {
    const { passSerialNumber } = req.params;
    const { passesUpdatedSince } = req.query;
    
    const digitalCard = await DigitalCard.findOne({ passSerialNumber })
      .populate("clientId");
    
    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Pass no encontrado",
      });
    }
    
    // Verificar si hay actualizaciones desde la última vez
    const lastUpdate = new Date(passesUpdatedSince || 0);
    
    if (digitalCard.lastUpdated > lastUpdate) {
      res.status(200).json({
        success: true,
        shouldUpdate: true,
        lastUpdated: digitalCard.lastUpdated,
        currentPoints: digitalCard.clientId.points,
      });
    } else {
      res.status(204).send(); // No hay actualizaciones
    }
  } catch (error) {
    console.error("Error verificando actualizaciones:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Log de eventos del pass (para debugging)
router.post("/log", async (req, res) => {
  try {
    const { logs } = req.body;
    
    // Registrar logs para debugging
    console.log("Apple Wallet logs:", logs);
    
    res.status(200).json({
      success: true,
      message: "Logs recibidos",
    });
  } catch (error) {
    console.error("Error procesando logs:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;