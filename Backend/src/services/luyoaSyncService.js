import LuyoaCard from "../models/LuyoaCard.js";
import LuyoaSyncQueue from "../models/LuyoaSyncQueue.js";
import { Client } from "../models/Client.js";

/**
 * LuyoaSyncService - Servicio de sincronización con Luyoa Wallet
 *
 * Este servicio maneja:
 * 1. Comunicación con la API de Luyoa
 * 2. Encolado de operaciones para sincronización
 * 3. Procesamiento de la cola con reintentos
 *
 * NOTA: Los endpoints de Luyoa son placeholder hasta obtener su documentación real.
 * Configurar las variables de entorno correspondientes.
 */

// Configuración de Luyoa (desde variables de entorno)
const LUYOA_CONFIG = {
  apiUrl: process.env.LUYOA_API_URL || "https://api.luyoa.com/v1",
  apiKey: process.env.LUYOA_API_KEY || "",
  merchantId: process.env.LUYOA_MERCHANT_ID || "",
  webhookSecret: process.env.LUYOA_WEBHOOK_SECRET || "",
  enabled: process.env.LUYOA_ENABLED === "true",
};

/**
 * Cliente HTTP para comunicación con Luyoa API
 */
class LuyoaApiClient {
  constructor(config) {
    this.config = config;
  }

  async request(endpoint, method = "GET", body = null) {
    if (!this.config.enabled) {
      console.log("[Luyoa] Integración deshabilitada, saltando request");
      return { success: true, simulated: true };
    }

    if (!this.config.apiKey) {
      throw new Error("LUYOA_API_KEY no configurada");
    }

    const url = `${this.config.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
        "X-Merchant-ID": this.config.merchantId,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`[Luyoa API] ${method} ${endpoint}`);

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.code = data.code || `HTTP_${response.status}`;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[Luyoa API Error] ${endpoint}:`, error.message);
      throw error;
    }
  }

  // === ENDPOINTS DE LUYOA (ajustar según documentación real) ===

  /**
   * Registrar nueva tarjeta en Luyoa
   */
  async registerCard(clientData) {
    return this.request("/cards", "POST", {
      external_id: clientData.clientId,
      name: clientData.name,
      phone: clientData.phone,
      email: clientData.email,
      initial_points: clientData.points || 0,
      metadata: clientData.metadata || {},
    });
  }

  /**
   * Actualizar puntos de una tarjeta
   */
  async updatePoints(cardId, points, transaction = {}) {
    return this.request(`/cards/${cardId}/points`, "PUT", {
      points,
      transaction_type: transaction.type || "adjustment",
      transaction_id: transaction.id,
      description: transaction.description,
    });
  }

  /**
   * Agregar puntos a una tarjeta
   */
  async addPoints(cardId, points, transaction = {}) {
    return this.request(`/cards/${cardId}/points/add`, "POST", {
      points,
      transaction_id: transaction.id,
      description: transaction.description,
      order_total: transaction.orderTotal,
    });
  }

  /**
   * Usar/redimir puntos de una tarjeta
   */
  async redeemPoints(cardId, points, transaction = {}) {
    return this.request(`/cards/${cardId}/points/redeem`, "POST", {
      points,
      transaction_id: transaction.id,
      description: transaction.description,
      reward_id: transaction.rewardId,
    });
  }

  /**
   * Obtener información de una tarjeta
   */
  async getCard(cardId) {
    return this.request(`/cards/${cardId}`, "GET");
  }

  /**
   * Obtener tarjeta por QR code
   */
  async getCardByQR(qrCode) {
    return this.request(`/cards/qr/${qrCode}`, "GET");
  }

  /**
   * Desactivar una tarjeta
   */
  async deactivateCard(cardId) {
    return this.request(`/cards/${cardId}/deactivate`, "POST");
  }

  /**
   * Actualizar tier/nivel de una tarjeta
   */
  async updateTier(cardId, tier) {
    return this.request(`/cards/${cardId}/tier`, "PUT", { tier });
  }

  /**
   * Enviar notificación push al wallet
   */
  async sendNotification(cardId, notification) {
    return this.request(`/cards/${cardId}/notify`, "POST", notification);
  }
}

const luyoaClient = new LuyoaApiClient(LUYOA_CONFIG);

/**
 * Servicio principal de sincronización
 */
const luyoaSyncService = {
  /**
   * Verificar si Luyoa está habilitado
   */
  isEnabled() {
    return LUYOA_CONFIG.enabled;
  },

  /**
   * Registrar un cliente en Luyoa y crear la tarjeta local
   */
  async registerClient(clientId, branchId) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error("Cliente no encontrado");
    }

    // Verificar si ya tiene tarjeta
    const existingCard = await LuyoaCard.findByClient(clientId, branchId);
    if (existingCard) {
      return { success: true, card: existingCard, alreadyExists: true };
    }

    // Encolar registro en Luyoa
    const job = await LuyoaSyncQueue.enqueue({
      operation: "card_register",
      clientId,
      branchId,
      payload: {
        clientId: clientId.toString(),
        name: client.getFullName(),
        phone: client.phoneNumber,
        email: client.email,
        points: client.points,
      },
      priority: 8, // Alta prioridad para registros
    });

    return { success: true, jobId: job._id, queued: true };
  },

  /**
   * Sincronizar puntos de un cliente con Luyoa
   */
  async syncPoints(clientId, branchId, options = {}) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error("Cliente no encontrado");
    }

    const luyoaCard = await LuyoaCard.findByClient(clientId, branchId);
    if (!luyoaCard) {
      // Auto-registrar si no existe
      console.log(`[Luyoa] Cliente ${clientId} no tiene tarjeta, registrando...`);
      return this.registerClient(clientId, branchId);
    }

    // Verificar si necesita sincronización
    if (!luyoaCard.needsSync(client.points)) {
      return { success: true, upToDate: true };
    }

    // Encolar sincronización
    const job = await LuyoaSyncQueue.enqueue({
      operation: "points_update",
      clientId,
      luyoaCardId: luyoaCard._id,
      branchId,
      orderId: options.orderId,
      payload: {
        luyoaCardId: luyoaCard.luyoaCardId,
        currentPoints: client.points,
        previousPoints: luyoaCard.syncedPoints,
        pointsDelta: client.points - luyoaCard.syncedPoints,
        transaction: {
          id: options.transactionId,
          type: options.type || "adjustment",
          description: options.description,
          orderTotal: options.orderTotal,
        },
      },
      priority: options.priority || 5,
    });

    return { success: true, jobId: job._id, queued: true };
  },

  /**
   * Procesar un job de la cola
   */
  async processJob(job) {
    console.log(`[Luyoa Worker] Procesando job ${job._id} - ${job.operation}`);

    try {
      let result;

      switch (job.operation) {
        case "card_register":
          result = await this._processCardRegister(job);
          break;

        case "points_update":
          result = await this._processPointsUpdate(job);
          break;

        case "reward_redeem":
          result = await this._processRewardRedeem(job);
          break;

        case "card_deactivate":
          result = await this._processCardDeactivate(job);
          break;

        case "tier_update":
          result = await this._processTierUpdate(job);
          break;

        default:
          throw new Error(`Operación no soportada: ${job.operation}`);
      }

      await job.markCompleted(result);
      console.log(`[Luyoa Worker] Job ${job._id} completado exitosamente`);
      return result;

    } catch (error) {
      console.error(`[Luyoa Worker] Job ${job._id} falló:`, error.message);
      await job.markFailed(error);
      throw error;
    }
  },

  /**
   * Procesar registro de tarjeta
   */
  async _processCardRegister(job) {
    const { payload, clientId, branchId } = job;

    // Llamar a Luyoa API
    const response = await luyoaClient.registerCard(payload);

    // Crear tarjeta local
    const luyoaCard = new LuyoaCard({
      clientId,
      branchId,
      luyoaCardId: response.card_id || response.id,
      luyoaPassId: response.pass_id,
      qrCode: response.qr_code,
      syncedPoints: payload.points,
      luyoaMetadata: response,
      lastSyncAt: new Date(),
    });

    await luyoaCard.save();

    return { cardId: luyoaCard._id, luyoaCardId: luyoaCard.luyoaCardId };
  },

  /**
   * Procesar actualización de puntos
   */
  async _processPointsUpdate(job) {
    const { payload, luyoaCardId } = job;

    // Llamar a Luyoa API
    const response = await luyoaClient.updatePoints(
      payload.luyoaCardId,
      payload.currentPoints,
      payload.transaction
    );

    // Actualizar tarjeta local
    if (luyoaCardId) {
      const card = await LuyoaCard.findById(luyoaCardId);
      if (card) {
        await card.markSynced(payload.currentPoints);
      }
    }

    return response;
  },

  /**
   * Procesar canje de recompensa
   */
  async _processRewardRedeem(job) {
    const { payload } = job;

    const response = await luyoaClient.redeemPoints(
      payload.luyoaCardId,
      payload.points,
      payload.transaction
    );

    // Actualizar puntos sincronizados
    if (job.luyoaCardId) {
      const card = await LuyoaCard.findById(job.luyoaCardId);
      if (card) {
        await card.markSynced(payload.newBalance);
      }
    }

    return response;
  },

  /**
   * Procesar desactivación de tarjeta
   */
  async _processCardDeactivate(job) {
    const { payload } = job;

    const response = await luyoaClient.deactivateCard(payload.luyoaCardId);

    // Actualizar estado local
    if (job.luyoaCardId) {
      await LuyoaCard.findByIdAndUpdate(job.luyoaCardId, {
        status: "inactive",
      });
    }

    return response;
  },

  /**
   * Procesar actualización de tier
   */
  async _processTierUpdate(job) {
    const { payload } = job;

    const response = await luyoaClient.updateTier(
      payload.luyoaCardId,
      payload.tier
    );

    // Actualizar tier local
    if (job.luyoaCardId) {
      await LuyoaCard.findByIdAndUpdate(job.luyoaCardId, {
        luyoaTier: payload.tier,
      });
    }

    return response;
  },

  /**
   * Obtener tarjeta por código QR (para escaneo en POS)
   */
  async getCardByQR(qrCode) {
    // Primero buscar localmente
    const localCard = await LuyoaCard.findByQR(qrCode);

    if (localCard) {
      return {
        success: true,
        card: localCard,
        client: localCard.clientId,
      };
    }

    // Si no existe localmente, buscar en Luyoa (para cards creadas externamente)
    if (LUYOA_CONFIG.enabled) {
      try {
        const luyoaResponse = await luyoaClient.getCardByQR(qrCode);
        // Aquí podrías crear la tarjeta local si Luyoa la devuelve
        return { success: false, notFound: true, luyoaResponse };
      } catch (error) {
        console.error("[Luyoa] Error buscando QR:", error.message);
      }
    }

    return { success: false, notFound: true };
  },

  /**
   * Encolar sincronización después de una compra
   */
  async queuePointsSync(clientId, branchId, pointsData) {
    const luyoaCard = await LuyoaCard.findByClient(clientId, branchId);

    if (!luyoaCard) {
      // Registrar automáticamente
      return this.registerClient(clientId, branchId);
    }

    return LuyoaSyncQueue.enqueue({
      operation: "points_update",
      clientId,
      luyoaCardId: luyoaCard._id,
      branchId,
      orderId: pointsData.orderId,
      payload: {
        luyoaCardId: luyoaCard.luyoaCardId,
        currentPoints: pointsData.currentPoints,
        previousPoints: pointsData.previousPoints,
        pointsDelta: pointsData.pointsAdded,
        transaction: {
          id: pointsData.historyId,
          type: "purchase",
          description: pointsData.description,
          orderTotal: pointsData.orderTotal,
        },
      },
      priority: 6,
    });
  },

  /**
   * Obtener estadísticas de la cola
   */
  async getQueueStats() {
    return LuyoaSyncQueue.getQueueStats();
  },
};

export default luyoaSyncService;
export { luyoaClient, LUYOA_CONFIG };
