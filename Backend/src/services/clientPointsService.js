import { Client } from "../models/Client.js";
import { ClientPointsHistory } from "../models/ClientPointsHistory.js";
import { PointsConfig } from "../models/PointsConfig.js";
import Order from "../models/Order.js";

/**
 * Servicio para gestionar los puntos de clientes
 */
const clientPointsService = {
  /**
   * Obtiene la configuración de puntos activa para una sucursal
   * @param {string} branchId - ID de la sucursal
   * @returns {Object|null} Configuración de puntos o null
   */
  async getPointsConfig(branchId) {
    try {
      const config = await PointsConfig.findOne({
        branch: branchId,
        status: true,
      });
      return config;
    } catch (error) {
      console.error("Error al obtener configuración de puntos:", error);
      return null;
    }
  },

  /**
   * Calcula puntos por total de compra
   * @param {number} orderTotal - Total de la orden
   * @param {Object} pointsConfig - Configuración de puntos
   * @returns {number} Puntos ganados
   */
  calculatePurchaseAmountPoints(orderTotal, pointsConfig) {
    if (!pointsConfig?.pointsPerPurchaseAmount?.enabled) {
      return 0;
    }

    const { amount, points } = pointsConfig.pointsPerPurchaseAmount;
    if (!amount || amount <= 0) return 0;

    // Calcular cuántas veces el total contiene el monto base
    const multiplier = Math.floor(orderTotal / amount);
    return multiplier * points;
  },

  /**
   * Verifica y calcula puntos por compras acumuladas
   * @param {string} clientId - ID del cliente
   * @param {string} branchId - ID de la sucursal
   * @param {Object} pointsConfig - Configuración de puntos
   * @returns {number} Puntos ganados (0 si no aplica)
   */
  async calculateAccumulatedPurchasesPoints(clientId, branchId, pointsConfig) {
    if (!pointsConfig?.pointsPerAccumulatedPurchases?.enabled) {
      return 0;
    }

    const { purchasesRequired, points } = pointsConfig.pointsPerAccumulatedPurchases;
    if (!purchasesRequired || purchasesRequired <= 0) return 0;

    try {
      // Contar órdenes válidas del cliente en esta sucursal
      // Solo cuentan órdenes con anticipo o enviadas a producción (no canceladas)
      const validOrdersCount = await Order.countDocuments({
        "clientInfo.clientId": clientId,
        branchId: branchId,
        status: { $ne: "cancelado" },
        $or: [
          { advance: { $gt: 0 } },
          { sendToProduction: true }
        ]
      });

      console.log(
        `📊 [Puntos Acumulados] Cliente: ${clientId}, Órdenes válidas: ${validOrdersCount}, Requeridas: ${purchasesRequired}`
      );

      // Verificar si el cliente alcanzó el umbral de compras
      // Dar puntos cuando alcanza exactamente el múltiplo requerido
      if (validOrdersCount > 0 && validOrdersCount % purchasesRequired === 0) {
        console.log(`✅ Cliente alcanzó ${validOrdersCount} compras, otorgando ${points} puntos bonus`);
        return points;
      }

      return 0;
    } catch (error) {
      console.error("Error al calcular puntos por compras acumuladas:", error);
      return 0;
    }
  },

  /**
   * Verifica si es la primera compra del cliente
   * @param {string} clientId - ID del cliente
   * @param {string} branchId - ID de la sucursal
   * @returns {boolean} true si es la primera compra
   */
  async isFirstPurchase(clientId, branchId) {
    try {
      const existingOrders = await Order.countDocuments({
        "clientInfo.clientId": clientId,
        branchId: branchId,
        status: { $ne: "cancelado" },
      });

      // Si no hay órdenes previas (o solo hay 1 que es la actual), es primera compra
      return existingOrders <= 1;
    } catch (error) {
      console.error("Error al verificar primera compra:", error);
      return false;
    }
  },

  /**
   * Calcula puntos por primera compra
   * @param {string} clientId - ID del cliente
   * @param {string} branchId - ID de la sucursal
   * @param {Object} pointsConfig - Configuración de puntos
   * @returns {number} Puntos ganados
   */
  async calculateFirstPurchasePoints(clientId, branchId, pointsConfig) {
    if (!pointsConfig?.pointsForFirstPurchase?.enabled) {
      return 0;
    }

    const isFirst = await this.isFirstPurchase(clientId, branchId);
    if (!isFirst) return 0;

    return pointsConfig.pointsForFirstPurchase.points || 0;
  },

  /**
   * Calcula puntos por registro de cliente
   * @param {Object} pointsConfig - Configuración de puntos
   * @returns {number} Puntos ganados
   */
  calculateRegistrationPoints(pointsConfig) {
    if (!pointsConfig?.pointsForClientRegistration?.enabled) {
      return 0;
    }

    return pointsConfig.pointsForClientRegistration.points || 0;
  },

  /**
   * Agrega puntos a un cliente y registra el historial
   * @param {Object} params - Parámetros
   * @param {string} params.clientId - ID del cliente
   * @param {number} params.points - Puntos a agregar
   * @param {string} params.type - Tipo: 'earned' o 'redeemed'
   * @param {string} params.reason - Razón del movimiento
   * @param {string} params.branchId - ID de la sucursal
   * @param {string} params.orderId - ID de la orden (opcional)
   * @param {string} params.description - Descripción (opcional)
   * @param {string} params.registeredBy - ID del usuario que registra (opcional)
   * @returns {Object} Resultado con cliente actualizado e historial
   */
  async addPointsToClient({
    clientId,
    points,
    type = "earned",
    reason,
    branchId,
    orderId = null,
    description = "",
    registeredBy = null,
  }) {
    try {
      if (!clientId || points === 0) {
        return { success: false, message: "Cliente o puntos no válidos" };
      }

      const client = await Client.findById(clientId);
      if (!client) {
        return { success: false, message: "Cliente no encontrado" };
      }

      const balanceBefore = client.points || 0;
      const pointsToAdd = type === "earned" ? Math.abs(points) : -Math.abs(points);
      const balanceAfter = Math.max(0, balanceBefore + pointsToAdd);

      // Actualizar puntos del cliente
      client.points = balanceAfter;
      await client.save();

      // Crear registro en el historial
      const historyEntry = await ClientPointsHistory.create({
        clientId,
        orderId,
        points: Math.abs(points),
        type,
        reason,
        description,
        branchId,
        balanceBefore,
        balanceAfter,
        registeredBy,
      });

      return {
        success: true,
        client,
        history: historyEntry,
        pointsAdded: pointsToAdd,
        newBalance: balanceAfter,
      };
    } catch (error) {
      console.error("Error al agregar puntos al cliente:", error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Procesa los puntos para una orden creada
   * NO incluye puntos por primera compra (se manejará desde otro lugar)
   * Solo procesa puntos si la orden tiene anticipo o fue enviada a producción
   * @param {Object} params - Parámetros
   * @param {string} params.clientId - ID del cliente
   * @param {string} params.branchId - ID de la sucursal
   * @param {string} params.orderId - ID de la orden
   * @param {number} params.orderTotal - Total de la orden
   * @param {number} params.advance - Anticipo de la orden
   * @param {boolean} params.sendToProduction - Si la orden fue enviada a producción
   * @param {string} params.registeredBy - ID del usuario que registra
   * @returns {Object} Resultado con puntos totales acumulados
   */
  async processOrderPoints({ clientId, branchId, orderId, orderTotal, advance, sendToProduction, registeredBy }) {
    if (!clientId || !branchId || !orderId) {
      return { success: false, totalPoints: 0, details: [] };
    }

    // Solo procesar puntos si la orden tiene anticipo o fue enviada a producción
    const hasAdvance = advance && advance > 0;
    const isSentToProduction = sendToProduction === true;

    if (!hasAdvance && !isSentToProduction) {
      console.log(
        `⏸️ [Puntos] Orden ${orderId} sin anticipo y sin envío a producción, no se acumulan puntos`
      );
      return {
        success: true,
        totalPoints: 0,
        details: [],
        message: "Orden sin anticipo ni envío a producción, no aplica para puntos",
      };
    }

    const pointsConfig = await this.getPointsConfig(branchId);
    if (!pointsConfig) {
      console.log("No hay configuración de puntos activa para la sucursal:", branchId);
      return { success: true, totalPoints: 0, details: [], message: "Sin configuración de puntos" };
    }

    const details = [];
    let totalPoints = 0;

    // 1. Puntos por total de compra
    const purchasePoints = this.calculatePurchaseAmountPoints(orderTotal, pointsConfig);
    if (purchasePoints > 0) {
      const result = await this.addPointsToClient({
        clientId,
        points: purchasePoints,
        type: "earned",
        reason: "purchase_amount",
        branchId,
        orderId,
        description: `Puntos por compra de $${orderTotal.toFixed(2)}`,
        registeredBy,
      });

      if (result.success) {
        totalPoints += purchasePoints;
        details.push({
          reason: "purchase_amount",
          points: purchasePoints,
          description: `Puntos por total de compra`,
        });
      }
    }

    // 2. Puntos por compras acumuladas
    const accumulatedPoints = await this.calculateAccumulatedPurchasesPoints(
      clientId,
      branchId,
      pointsConfig
    );
    if (accumulatedPoints > 0) {
      const result = await this.addPointsToClient({
        clientId,
        points: accumulatedPoints,
        type: "earned",
        reason: "accumulated_purchases",
        branchId,
        orderId,
        description: `Bono por alcanzar ${pointsConfig.pointsPerAccumulatedPurchases.purchasesRequired} compras`,
        registeredBy,
      });

      if (result.success) {
        totalPoints += accumulatedPoints;
        details.push({
          reason: "accumulated_purchases",
          points: accumulatedPoints,
          description: `Puntos por compras acumuladas`,
        });
      }
    }

    // NOTA: NO se incluyen puntos por primera compra aquí
    // Se manejarán desde otra parte del sistema según lo solicitado

    return {
      success: true,
      totalPoints,
      details,
      configUsed: pointsConfig._id,
    };
  },

  /**
   * Procesa puntos por registro de cliente
   * @param {Object} params - Parámetros
   * @param {string} params.clientId - ID del cliente
   * @param {string} params.branchId - ID de la sucursal
   * @param {string} params.registeredBy - ID del usuario que registra
   * @returns {Object} Resultado
   */
  async processRegistrationPoints({ clientId, branchId, registeredBy }) {
    if (!clientId || !branchId) {
      return { success: false, points: 0 };
    }

    const pointsConfig = await this.getPointsConfig(branchId);
    if (!pointsConfig) {
      return { success: true, points: 0, message: "Sin configuración de puntos" };
    }

    const registrationPoints = this.calculateRegistrationPoints(pointsConfig);
    if (registrationPoints > 0) {
      const result = await this.addPointsToClient({
        clientId,
        points: registrationPoints,
        type: "earned",
        reason: "client_registration",
        branchId,
        description: "Puntos de bienvenida por registro",
        registeredBy,
      });

      return {
        success: result.success,
        points: registrationPoints,
        newBalance: result.newBalance,
      };
    }

    return { success: true, points: 0 };
  },

  /**
   * Obtiene el historial de puntos de un cliente
   * @param {string} clientId - ID del cliente
   * @param {Object} options - Opciones de paginación y filtros
   * @returns {Object} Historial paginado
   */
  async getClientPointsHistory(clientId, options = {}) {
    const { page = 1, limit = 10, type, branchId } = options;
    const skip = (page - 1) * limit;

    const filters = { clientId };
    if (type) filters.type = type;
    if (branchId) filters.branchId = branchId;

    try {
      const history = await ClientPointsHistory.find(filters)
        .populate("orderId", "orderNumber total")
        .populate("branchId", "branchName")
        .populate("registeredBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ClientPointsHistory.countDocuments(filters);

      return {
        success: true,
        data: history,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error al obtener historial de puntos:", error);
      return { success: false, message: error.message };
    }
  },
};

export default clientPointsService;
