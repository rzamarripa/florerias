import LuyoaCard from "../models/LuyoaCard.js";
import LuyoaSyncQueue from "../models/LuyoaSyncQueue.js";
import { Client } from "../models/Client.js";
import luyoaSyncService from "../services/luyoaSyncService.js";
import clientPointsService from "../services/clientPointsService.js";

/**
 * LoyaltyController - Endpoints para integración de lealtad con Luyoa
 *
 * Flujo principal:
 * 1. Cliente muestra QR → POS escanea
 * 2. POST /api/loyalty/scan → userId identificado
 * 3. Se crea venta → Se suman puntos
 * 4. POST /api/loyalty/sync → Worker ejecuta
 * 5. Tarjeta se actualiza → Wallet refresca
 */

/**
 * POST /api/loyalty/scan
 * Escanear código QR de tarjeta Luyoa
 * Este endpoint identifica al cliente por su código QR
 */
export const scanLoyaltyCard = async (req, res) => {
  try {
    const { qrCode, branchId } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "El código QR es requerido",
      });
    }

    // Buscar tarjeta por QR
    const result = await luyoaSyncService.getCardByQR(qrCode);

    if (!result.success || result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta no encontrada o inactiva",
      });
    }

    const { card, client } = result;

    // Preparar respuesta con datos del cliente
    const responseData = {
      cardId: card._id,
      luyoaCardId: card.luyoaCardId,
      client: {
        _id: client._id,
        name: client.name,
        lastName: client.lastName,
        fullName: client.getFullName(),
        phoneNumber: client.phoneNumber,
        email: client.email,
        points: client.points,
        clientNumber: client.clientNumber,
      },
      tier: card.luyoaTier,
      syncedPoints: card.syncedPoints,
      lastSyncAt: card.lastSyncAt,
    };

    res.status(200).json({
      success: true,
      message: "Cliente identificado",
      data: responseData,
    });

  } catch (error) {
    console.error("Error al escanear tarjeta:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/loyalty/sync
 * Encolar sincronización de puntos con Luyoa
 * Llamar después de acumular puntos en una orden
 */
export const syncPoints = async (req, res) => {
  try {
    const { clientId, branchId, orderId, orderTotal, pointsAdded, description } = req.body;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "El clientId es requerido",
      });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Encolar sincronización
    const result = await luyoaSyncService.queuePointsSync(clientId, branchId, {
      orderId,
      orderTotal,
      pointsAdded,
      currentPoints: client.points,
      previousPoints: client.points - (pointsAdded || 0),
      description,
    });

    res.status(200).json({
      success: true,
      message: result.queued ? "Sincronización encolada" : "Cliente sin tarjeta Luyoa",
      data: result,
    });

  } catch (error) {
    console.error("Error al encolar sincronización:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/loyalty/register
 * Registrar cliente en Luyoa y crear tarjeta
 */
export const registerLoyaltyCard = async (req, res) => {
  try {
    const { clientId, branchId } = req.body;

    if (!clientId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "clientId y branchId son requeridos",
      });
    }

    const result = await luyoaSyncService.registerClient(clientId, branchId);

    if (result.alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "El cliente ya tiene una tarjeta Luyoa",
        data: { card: result.card },
      });
    }

    res.status(201).json({
      success: true,
      message: result.queued
        ? "Registro en Luyoa encolado"
        : "Tarjeta registrada exitosamente",
      data: result,
    });

  } catch (error) {
    console.error("Error al registrar tarjeta:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/loyalty/card/:clientId
 * Obtener tarjeta Luyoa de un cliente
 */
export const getLoyaltyCard = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { branchId } = req.query;

    const card = await LuyoaCard.findByClient(clientId, branchId);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "El cliente no tiene tarjeta Luyoa",
      });
    }

    res.status(200).json({
      success: true,
      data: card,
    });

  } catch (error) {
    console.error("Error al obtener tarjeta:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/loyalty/queue/stats
 * Obtener estadísticas de la cola de sincronización
 */
export const getQueueStats = async (req, res) => {
  try {
    const stats = await luyoaSyncService.getQueueStats();

    // Obtener jobs fallidos recientes
    const failedJobs = await LuyoaSyncQueue.find({ status: "failed" })
      .sort({ completedAt: -1 })
      .limit(10)
      .select("operation clientId lastError createdAt completedAt");

    // Obtener jobs pendientes
    const pendingCount = await LuyoaSyncQueue.countDocuments({
      status: "pending",
      $or: [
        { nextRetryAt: null },
        { nextRetryAt: { $lte: new Date() } },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        stats,
        pendingReady: pendingCount,
        recentFailures: failedJobs,
      },
    });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/loyalty/queue/retry/:jobId
 * Reintentar un job fallido
 */
export const retryJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await LuyoaSyncQueue.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job no encontrado",
      });
    }

    if (job.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: `El job no está en estado fallido (estado actual: ${job.status})`,
      });
    }

    // Resetear job para reintento
    job.status = "pending";
    job.retryCount = 0;
    job.nextRetryAt = null;
    await job.save();

    res.status(200).json({
      success: true,
      message: "Job reencolado para reintento",
      data: { jobId: job._id },
    });

  } catch (error) {
    console.error("Error al reintentar job:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/loyalty/webhook
 * Endpoint para recibir webhooks de Luyoa
 */
export const handleWebhook = async (req, res) => {
  try {
    const { event, data, timestamp, signature } = req.body;

    // TODO: Verificar firma del webhook
    // const isValid = verifyWebhookSignature(req.body, signature);
    // if (!isValid) return res.status(401).json({ error: "Invalid signature" });

    console.log(`[Luyoa Webhook] Evento recibido: ${event}`);

    switch (event) {
      case "card.scanned":
        // Una tarjeta fue escaneada externamente
        console.log(`[Luyoa Webhook] Tarjeta escaneada: ${data.card_id}`);
        break;

      case "points.updated":
        // Puntos actualizados desde Luyoa (ej: promoción)
        console.log(`[Luyoa Webhook] Puntos actualizados: ${data.card_id} -> ${data.points}`);
        // Sincronizar puntos hacia tu sistema si es necesario
        break;

      case "reward.redeemed":
        // Recompensa canjeada desde la app del cliente
        console.log(`[Luyoa Webhook] Recompensa canjeada: ${data.reward_id}`);
        break;

      case "card.expired":
        // Tarjeta expirada
        console.log(`[Luyoa Webhook] Tarjeta expirada: ${data.card_id}`);
        await LuyoaCard.findOneAndUpdate(
          { luyoaCardId: data.card_id },
          { status: "expired" }
        );
        break;

      default:
        console.log(`[Luyoa Webhook] Evento no manejado: ${event}`);
    }

    // Siempre responder 200 para confirmar recepción
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("Error en webhook:", error);
    // Aún así responder 200 para evitar reintentos de Luyoa
    res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * POST /api/loyalty/process-order
 * Endpoint combinado: procesa puntos y encola sincronización
 * Útil para llamar directamente después de crear una orden
 */
export const processOrderLoyalty = async (req, res) => {
  try {
    const {
      clientId,
      branchId,
      orderId,
      orderTotal,
      advance,
      sendToProduction,
    } = req.body;

    if (!clientId || !branchId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "clientId, branchId y orderId son requeridos",
      });
    }

    // 1. Procesar puntos con tu sistema actual
    const pointsResult = await clientPointsService.processOrderPoints({
      clientId,
      branchId,
      orderId,
      orderTotal,
      advance: advance || 0,
      sendToProduction: sendToProduction || false,
      registeredBy: req.user?._id,
    });

    // 2. Si se ganaron puntos, encolar sincronización con Luyoa
    if (pointsResult.success && pointsResult.totalPoints > 0) {
      const client = await Client.findById(clientId);

      await luyoaSyncService.queuePointsSync(clientId, branchId, {
        orderId,
        orderTotal,
        pointsAdded: pointsResult.totalPoints,
        currentPoints: client.points,
        previousPoints: client.points - pointsResult.totalPoints,
        description: `Compra - Orden ${orderId}`,
      });
    }

    res.status(200).json({
      success: true,
      message: pointsResult.totalPoints > 0
        ? `${pointsResult.totalPoints} puntos agregados y encolados para sincronización`
        : "No se generaron puntos para esta orden",
      data: {
        pointsResult,
        syncQueued: pointsResult.totalPoints > 0,
      },
    });

  } catch (error) {
    console.error("Error al procesar lealtad de orden:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
