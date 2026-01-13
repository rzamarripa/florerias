import express from "express";
import {
  scanQRCode,
  processPointsTransaction,
  processRewardRedemption,
  validateTemporaryQR,
  getScanHistory,
  useRewardInOrder,
} from "../controllers/scannerController.js";
import qrCodeService from "../services/digitalCards/qrCodeService.js";
import { Client } from "../models/Client.js";
import { PointsReward } from "../models/PointsReward.js";

const router = express.Router();

// Rutas principales del scanner

// Escanear código QR de tarjeta digital
router.post("/scan", scanQRCode);

// Procesar transacción de puntos (ganar o canjear)
router.post("/points-transaction", processPointsTransaction);

// Procesar canje de recompensa
router.post("/redeem-reward", processRewardRedemption);

// Validar QR temporal
router.post("/validate-temporary", validateTemporaryQR);

// Obtener historial de escaneos de un cliente
router.get("/history/:clientId", getScanHistory);

// Usar recompensa en una orden
router.post("/use-reward", useRewardInOrder);

// Rutas adicionales para funcionalidades específicas

// Verificar estado de cliente por escaneo rápido
router.post("/quick-check", async (req, res) => {
  try {
    const { qrData } = req.body;
    
    // Validar QR
    const validation = await qrCodeService.validateQRCode(qrData);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "QR inválido",
      });
    }
    
    // Buscar cliente
    const client = await Client.findById(validation.data.clientId)
      .select("name lastName clientNumber points status");
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        name: client.getFullName(),
        clientNumber: client.clientNumber,
        points: client.points,
        isActive: client.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Obtener recompensas disponibles para canje por escaneo
router.post("/available-rewards", async (req, res) => {
  try {
    const { qrData, branchId } = req.body;
    
    // Validar QR
    const validation = await qrCodeService.validateQRCode(qrData);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "QR inválido",
      });
    }
    
    // Buscar cliente
    const client = await Client.findById(validation.data.clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }
    
    // Buscar recompensas disponibles para el cliente
    const availableRewards = await PointsReward.find({
      branch: branchId,
      status: true,
      pointsRequired: { $lte: client.points },
      $or: [
        { validUntil: null },
        { validUntil: { $gte: new Date() } },
      ],
    });
    
    res.status(200).json({
      success: true,
      data: {
        clientPoints: client.points,
        rewards: availableRewards.filter(r => r.canBeRedeemed()),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Simulación de escaneo para pruebas
router.post("/simulate", async (req, res) => {
  try {
    const { clientNumber, branchId } = req.body;
    
    // Buscar cliente por número
    const client = await Client.findOne({ clientNumber })
      .populate("branch")
      .populate({
        path: "rewards",
        populate: {
          path: "reward",
          model: "points_reward",
        },
      });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }
    
    // Simular respuesta de escaneo
    res.status(200).json({
      success: true,
      simulated: true,
      data: {
        client: {
          id: client._id,
          name: client.getFullName(),
          clientNumber: client.clientNumber,
          points: client.points,
        },
        rewards: {
          available: client.rewards.filter(r => !r.isRedeemed).length,
          list: client.rewards
            .filter(r => !r.isRedeemed)
            .map(r => ({
              id: r._id,
              name: r.reward?.name,
              code: r.code,
            })),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Validar múltiples QRs en batch (para eventos masivos)
router.post("/batch-validate", async (req, res) => {
  try {
    const { qrCodes } = req.body;
    
    if (!Array.isArray(qrCodes)) {
      return res.status(400).json({
        success: false,
        message: "Se esperaba un array de códigos QR",
      });
    }
    
    const results = await Promise.all(
      qrCodes.map(async (qrData) => {
        try {
          const validation = await qrCodeService.validateQRCode(qrData);
          
          if (validation.valid) {
            const client = await Client.findById(validation.data.clientId)
              .select("name lastName clientNumber points");
            
            return {
              qrData,
              valid: true,
              client: client ? {
                name: client.getFullName(),
                clientNumber: client.clientNumber,
                points: client.points,
              } : null,
            };
          }
          
          return {
            qrData,
            valid: false,
            error: validation.error,
          };
        } catch (error) {
          return {
            qrData,
            valid: false,
            error: error.message,
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      total: qrCodes.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;