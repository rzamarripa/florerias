import { DigitalCard } from "../models/DigitalCard.js";
import { Client } from "../models/Client.js";
import { CardTransaction } from "../models/CardTransaction.js";
import Order from "../models/Order.js";
import { PointsReward } from "../models/PointsReward.js";
import { Branch } from "../models/Branch.js";
import qrCodeService from "../services/digitalCards/qrCodeService.js";
import clientPointsService from "../services/clientPointsService.js";

/**
 * Escanea y valida un código QR de tarjeta digital
 */
export const scanQRCode = async (req, res) => {
  try {
    const { qrData, branchId, employeeId, terminalId, deviceInfo } = req.body;

    if (!qrData || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Datos QR y sucursal son requeridos",
      });
    }

    // Validar el código QR
    const validation = await qrCodeService.validateQRCode(qrData);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Código QR inválido o expirado",
        error: validation.error,
      });
    }

    const qrPayload = validation.data;

    // Buscar la tarjeta digital
    const digitalCard = await DigitalCard.findOne({
      passSerialNumber: qrPayload.passSerialNumber,
      isActive: true,
    });

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada o inactiva",
      });
    }

    // Verificar que la tarjeta pertenezca al cliente correcto
    if (digitalCard.clientId.toString() !== qrPayload.clientId) {
      return res.status(403).json({
        success: false,
        message: "La tarjeta no corresponde al cliente",
      });
    }

    // Obtener información completa del cliente
    const client = await Client.findById(qrPayload.clientId)
      .populate("company")
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

    // Verificar que el cliente esté activo
    if (!client.status) {
      return res.status(403).json({
        success: false,
        message: "Cliente inactivo",
      });
    }

    // Obtener la sucursal para obtener el companyId
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Registrar el escaneo en las transacciones
    await CardTransaction.createScanTransaction({
      digitalCardId: digitalCard._id,
      clientId: client._id,
      scanMethod: "qr",
      currentPoints: client.points,
      branchId,
      companyId: branch.companyId,
      terminalId,
      employeeId,
      deviceInfo,
    });

    // Obtener recompensas disponibles (no canjeadas)
    const availableRewards = client.rewards.filter(r => !r.isRedeemed);

    // Preparar respuesta con toda la información del cliente
    const response = {
      success: true,
      data: {
        client: {
          id: client._id,
          name: client.name,
          lastName: client.lastName,
          fullName: client.getFullName(),
          clientNumber: client.clientNumber,
          phoneNumber: client.phoneNumber,
          email: client.email,
          points: client.points,
          status: client.status,
        },
        branch: {
          id: client.company._id,
          name: client.company.legalName || client.company.tradeName || "Empresa",
        },
        digitalCard: {
          id: digitalCard._id,
          lastUpdated: digitalCard.lastUpdated,
          isActive: digitalCard.isActive,
        },
        rewards: {
          available: availableRewards.length,
          list: availableRewards.map(r => ({
            id: r._id,
            rewardId: r.reward._id,
            name: r.reward.name,
            code: r.code,
            pointsRequired: r.reward.pointsRequired,
            rewardType: r.reward.rewardType,
            rewardValue: r.reward.rewardValue,
            isPercentage: r.reward.isPercentage,
          })),
        },
        scanTime: new Date(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error escaneando QR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Procesa una transacción de puntos después del escaneo
 */
export const processPointsTransaction = async (req, res) => {
  try {
    const {
      clientId,
      orderId,
      points,
      type, // "earn" o "redeem"
      branchId,
      employeeId,
      reason,
    } = req.body;

    // Validaciones
    if (!clientId || !points || !type || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos",
      });
    }

    // Buscar el cliente y su tarjeta digital
    const client = await Client.findById(clientId);
    const digitalCard = await DigitalCard.findOne({ clientId });

    if (!client || !digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Cliente o tarjeta digital no encontrada",
      });
    }

    const balanceBefore = client.points;
    let balanceAfter = balanceBefore;
    let transactionType = "";

    // Procesar según el tipo de transacción
    if (type === "earn") {
      // Agregar puntos
      await client.addPoints(points);
      balanceAfter = client.points;
      transactionType = "points_earned";

      // Registrar en el historial de puntos
      await clientPointsService.addPointsHistory({
        clientId,
        orderId,
        points,
        type: "earned",
        reason: reason || "purchase_amount",
        branchId,
        balanceBefore,
        balanceAfter,
        registeredBy: employeeId,
      });
    } else if (type === "redeem") {
      // Validar que tenga suficientes puntos
      if (client.points < points) {
        return res.status(400).json({
          success: false,
          message: "Puntos insuficientes",
          currentPoints: client.points,
          requiredPoints: points,
        });
      }

      // Usar puntos
      await client.usePoints(points);
      balanceAfter = client.points;
      transactionType = "points_redeemed";

      // Registrar en el historial
      await clientPointsService.addPointsHistory({
        clientId,
        orderId,
        points: -points,
        type: "redeemed",
        reason: reason || "redemption",
        branchId,
        balanceBefore,
        balanceAfter,
        registeredBy: employeeId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Tipo de transacción inválido",
      });
    }

    // Actualizar la tarjeta digital
    await digitalCard.updateBalance(balanceAfter);

    // Obtener la sucursal para el companyId
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Registrar la transacción de la tarjeta
    await CardTransaction.createPointsTransaction({
      digitalCardId: digitalCard._id,
      clientId,
      type: transactionType,
      points,
      balanceBefore,
      balanceAfter,
      orderId,
      branchId,
      companyId: branch.companyId,
      employeeId,
    });

    res.status(200).json({
      success: true,
      data: {
        transactionType,
        pointsInvolved: points,
        balanceBefore,
        balanceAfter,
        client: {
          id: client._id,
          name: client.getFullName(),
          clientNumber: client.clientNumber,
        },
      },
    });
  } catch (error) {
    console.error("Error procesando transacción de puntos:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Procesa el canje de una recompensa
 */
export const processRewardRedemption = async (req, res) => {
  try {
    const {
      clientId,
      rewardId,
      branchId,
      employeeId,
    } = req.body;

    // Validaciones
    if (!clientId || !rewardId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos",
      });
    }

    // Buscar cliente, recompensa y tarjeta
    const client = await Client.findById(clientId);
    const reward = await PointsReward.findById(rewardId);
    const digitalCard = await DigitalCard.findOne({ clientId });

    if (!client || !reward || !digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Cliente, recompensa o tarjeta no encontrada",
      });
    }

    // Validar que la recompensa esté activa
    if (!reward.canBeRedeemed()) {
      return res.status(400).json({
        success: false,
        message: "La recompensa no está disponible",
      });
    }

    // Validar puntos suficientes
    if (client.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: "Puntos insuficientes",
        currentPoints: client.points,
        requiredPoints: reward.pointsRequired,
      });
    }

    // Generar código de canje único
    const redemptionCode = generateRedemptionCode();

    // Agregar la recompensa al cliente
    client.rewards.push({
      reward: reward._id,
      code: redemptionCode,
      isRedeemed: true,
      redeemedAt: new Date(),
    });

    // Descontar los puntos
    const balanceBefore = client.points;
    await client.usePoints(reward.pointsRequired);
    const balanceAfter = client.points;

    // Actualizar contadores de la recompensa
    reward.totalRedemptions += 1;
    await reward.save();

    // Actualizar balance en la tarjeta digital
    await digitalCard.updateBalance(balanceAfter);

    // Registrar en el historial de puntos
    await clientPointsService.addPointsHistory({
      clientId,
      points: -reward.pointsRequired,
      type: "redeemed",
      reason: "redemption",
      description: `Canje de recompensa: ${reward.name}`,
      branchId,
      balanceBefore,
      balanceAfter,
      registeredBy: employeeId,
    });

    // Obtener la sucursal para el companyId
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Registrar la transacción de la tarjeta
    await CardTransaction.createRewardTransaction({
      digitalCardId: digitalCard._id,
      clientId,
      type: "reward_claimed",
      pointsUsed: reward.pointsRequired,
      balanceBefore,
      balanceAfter,
      rewardId: reward._id,
      branchId,
      companyId: branch.companyId,
      employeeId,
      notes: `Recompensa canjeada: ${reward.name}`,
    });

    res.status(200).json({
      success: true,
      data: {
        redemptionCode,
        reward: {
          id: reward._id,
          name: reward.name,
          type: reward.rewardType,
          value: reward.rewardValue,
          isPercentage: reward.isPercentage,
          pointsUsed: reward.pointsRequired,
        },
        client: {
          id: client._id,
          name: client.getFullName(),
          pointsBefore: balanceBefore,
          pointsAfter: balanceAfter,
        },
      },
    });
  } catch (error) {
    console.error("Error procesando canje de recompensa:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Valida un código QR temporal
 */
export const validateTemporaryQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: "Datos QR requeridos",
      });
    }

    // Validar el QR temporal
    const validation = await qrCodeService.validateQRCode(qrData);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "QR temporal inválido o expirado",
        error: validation.error,
      });
    }

    // Verificar que sea un QR temporal
    if (validation.data.type !== "temporary") {
      return res.status(400).json({
        success: false,
        message: "No es un código QR temporal válido",
      });
    }

    // Verificar expiración adicional
    if (Date.now() > validation.data.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "El código QR temporal ha expirado",
      });
    }

    res.status(200).json({
      success: true,
      data: validation.data,
    });
  } catch (error) {
    console.error("Error validando QR temporal:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene el historial de escaneos de un cliente
 */
export const getScanHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 50, skip = 0, branchId } = req.query;

    const query = {
      clientId,
      transactionType: "scan",
    };

    if (branchId) {
      query["locationData.branchId"] = branchId;
    }

    const scans = await CardTransaction.find(query)
      .populate("locationData.branchId", "name")
      .populate("locationData.employeeId", "name")
      .sort({ processedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await CardTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: scans,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("Error obteniendo historial de escaneos:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Registra el uso de una recompensa en una orden
 */
export const useRewardInOrder = async (req, res) => {
  try {
    const { 
      clientId, 
      rewardCode, 
      orderId,
      branchId,
      employeeId 
    } = req.body;

    // Buscar el cliente y la recompensa por código
    const client = await Client.findById(clientId).populate("rewards.reward");
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Buscar la recompensa específica por código
    const clientReward = client.rewards.find(
      r => r.code === rewardCode && r.isRedeemed && !r.usedAt
    );

    if (!clientReward) {
      return res.status(404).json({
        success: false,
        message: "Recompensa no encontrada o ya utilizada",
      });
    }

    // Marcar la recompensa como utilizada
    clientReward.usedAt = new Date();
    clientReward.usedInOrder = orderId;
    await client.save();

    // Buscar la tarjeta digital
    const digitalCard = await DigitalCard.findOne({ clientId });

    if (digitalCard) {
      // Obtener la sucursal para el companyId
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "Sucursal no encontrada",
        });
      }

      // Registrar el uso de la recompensa
      await CardTransaction.createRewardTransaction({
        digitalCardId: digitalCard._id,
        clientId,
        type: "reward_used",
        rewardId: clientReward.reward._id,
        orderId,
        branchId,
        companyId: branch.companyId,
        employeeId,
        balanceBefore: client.points,
        balanceAfter: client.points,
        notes: `Recompensa utilizada en orden: ${orderId}`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        rewardUsed: true,
        rewardDetails: {
          name: clientReward.reward.name,
          type: clientReward.reward.rewardType,
          value: clientReward.reward.rewardValue,
          isPercentage: clientReward.reward.isPercentage,
        },
        orderId,
      },
    });
  } catch (error) {
    console.error("Error usando recompensa en orden:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Función auxiliar para generar código de canje
const generateRedemptionCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export default {
  scanQRCode,
  processPointsTransaction,
  processRewardRedemption,
  validateTemporaryQR,
  getScanHistory,
  useRewardInOrder,
};