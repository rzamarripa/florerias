import { Client } from "../models/Client.js";
import { ClientPointsHistory } from "../models/ClientPointsHistory.js";
import { PointsConfig } from "../models/PointsConfig.js";
import { Branch } from "../models/Branch.js";
import Order from "../models/Order.js";

/**
 * Servicio para gestionar los puntos de clientes
 */
const clientPointsService = {
  /**
   * Obtiene la configuración de puntos activa para una sucursal (DEPRECADO - usar getPointsConfigs)
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
   * Obtiene AMBAS configuraciones de puntos (global y específica)
   * @param {string} branchId - ID de la sucursal
   * @returns {Object} Objeto con configuración global y de sucursal
   */
  async getPointsConfigs(branchId) {
    const configs = {
      branch: null,
      global: null
    };

    try {
      console.error(`🔍 [DEBUG] Iniciando búsqueda de configuraciones para branchId: ${branchId} (tipo: ${typeof branchId})`);
      
      // Obtener configuración específica de sucursal
      const branchQuery = {
        branch: branchId,
        isGlobal: false,
        status: true,
      };
      console.error(`🔍 [DEBUG] Query sucursal:`, JSON.stringify(branchQuery, null, 2));
      
      configs.branch = await PointsConfig.findOne(branchQuery);
      console.error(`🔍 [DEBUG] Resultado config sucursal:`, configs.branch ? `ENCONTRADA (ID: ${configs.branch._id})` : 'NO ENCONTRADA');

      // Obtener la sucursal para conocer su empresa
      const branch = await Branch.findById(branchId);
      console.error(`🔍 [DEBUG] Sucursal encontrada:`, branch ? `SI (companyId: ${branch.companyId})` : 'NO');
      
      if (branch?.companyId) {
        // Obtener configuración global de empresa
        const globalQuery = {
          company: branch.companyId,
          isGlobal: true,
          status: true,
        };
        console.error(`🔍 [DEBUG] Query global:`, JSON.stringify(globalQuery, null, 2));
        
        configs.global = await PointsConfig.findOne(globalQuery);
        console.error(`🔍 [DEBUG] Resultado config global:`, configs.global ? `ENCONTRADA (ID: ${configs.global._id})` : 'NO ENCONTRADA');
      }

      console.error(`📊 [Configuraciones de Puntos] Sucursal: ${configs.branch ? '✓' : '✗'}, Global: ${configs.global ? '✓' : '✗'}`);
      return configs;
    } catch (error) {
      console.error("Error al obtener configuraciones de puntos:", error);
      return configs;
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
   * @param {boolean} isGlobalConfig - Si es configuración global (cuenta órdenes de toda la empresa)
   * @returns {number} Puntos ganados (0 si no aplica)
   */
  async calculateAccumulatedPurchasesPoints(clientId, branchId, pointsConfig, isGlobalConfig = false) {
    if (!pointsConfig?.pointsPerAccumulatedPurchases?.enabled) {
      return 0;
    }

    const { purchasesRequired, points } = pointsConfig.pointsPerAccumulatedPurchases;
    if (!purchasesRequired || purchasesRequired <= 0) return 0;

    try {
      // Construir el query base
      const query = {
        "clientInfo.clientId": clientId,
        status: { $ne: "cancelado" },
        $or: [
          { advance: { $gt: 0 } },
          { sendToProduction: true }
        ]
      };

      // Determinar el scope (global o sucursal) para buscar historial de puntos
      let branchScope;
      
      // Si es configuración global, contar órdenes de todas las sucursales de la empresa
      if (isGlobalConfig) {
        // Obtener todas las sucursales de la empresa
        const branch = await Branch.findById(branchId);
        if (branch && branch.companyId) {
          const companyBranches = await Branch.find({ companyId: branch.companyId }).select('_id');
          const branchIds = companyBranches.map(b => b._id);
          query.branchId = { $in: branchIds };
          branchScope = branchIds; // Guardar para verificar historial
          console.error(`📊 [Puntos Acumulados GLOBAL] Contando órdenes de ${branchIds.length} sucursales de la empresa`);
        } else {
          // Si no se puede obtener la empresa, usar solo la sucursal actual
          query.branchId = branchId;
          branchScope = [branchId];
        }
      } else {
        // Para configuración de sucursal, contar solo órdenes de esa sucursal
        query.branchId = branchId;
        branchScope = [branchId];
        console.error(`📊 [Puntos Acumulados SUCURSAL] Contando órdenes solo de la sucursal ${branchId}`);
      }

      // Contar órdenes válidas del cliente
      const validOrdersCount = await Order.countDocuments(query);

      console.error(
        `📊 [Puntos Acumulados] Cliente: ${clientId}, Órdenes válidas: ${validOrdersCount}, Requeridas: ${purchasesRequired}, Config: ${isGlobalConfig ? 'GLOBAL' : 'SUCURSAL'}`
      );

      // Si no hay suficientes órdenes, no dar puntos
      if (validOrdersCount < purchasesRequired) {
        return 0;
      }

      // Calcular cuántos "hitos" ha alcanzado el cliente
      const milestonesReached = Math.floor(validOrdersCount / purchasesRequired);
      
      // Buscar cuántos hitos ya han sido premiados anteriormente
      const previousRewards = await ClientPointsHistory.countDocuments({
        clientId: clientId,
        branchId: { $in: branchScope },
        reason: "accumulated_purchases",
        configSource: isGlobalConfig ? "global" : "branch",
        type: "earned"
      });

      console.error(
        `📊 [Puntos Acumulados] Hitos alcanzados: ${milestonesReached}, Hitos ya premiados: ${previousRewards}`
      );

      // Si ya se han dado todos los puntos por los hitos alcanzados, no dar más
      if (previousRewards >= milestonesReached) {
        console.error(`⚠️ Cliente ya recibió puntos por ${previousRewards} hito(s), no se otorgan puntos adicionales`);
        return 0;
      }

      // Otorgar puntos solo por el nuevo hito alcanzado
      console.error(`✅ Cliente alcanzó nuevo hito #${milestonesReached} (${validOrdersCount} compras), otorgando ${points} puntos bonus (${isGlobalConfig ? 'GLOBAL' : 'SUCURSAL'})`);
      return points;

    } catch (error) {
      console.error("Error al calcular puntos por compras acumuladas:", error);
      return 0;
    }
  },

  /**
   * Verifica si es la primera compra del cliente en una sucursal específica
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
   * Verifica si es la primera compra del cliente a nivel empresa (en cualquier sucursal)
   * @param {string} clientId - ID del cliente
   * @param {string} companyId - ID de la empresa
   * @returns {boolean} true si es la primera compra en toda la empresa
   */
  async isFirstPurchaseInCompany(clientId, companyId) {
    try {
      // Obtener todas las sucursales de la empresa
      const branches = await Branch.find({ companyId }).select('_id');
      const branchIds = branches.map(b => b._id);
      
      // Buscar órdenes del cliente en cualquier sucursal de la empresa
      const existingOrders = await Order.countDocuments({
        "clientInfo.clientId": clientId,
        branchId: { $in: branchIds },
        status: { $ne: "cancelado" },
      });

      // Si no hay órdenes previas (o solo hay 1 que es la actual), es primera compra
      return existingOrders <= 1;
    } catch (error) {
      console.error("Error al verificar primera compra a nivel empresa:", error);
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
   * @param {string} params.configSource - Fuente de configuración: 'global', 'branch', 'manual' (opcional)
   * @param {string} params.companyId - ID de la empresa (opcional)
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
    configSource = "branch",
    companyId = null,
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
        companyId,
        configSource,
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
   * Procesa puntos de una configuración específica
   * @param {Object} params - Parámetros
   * @param {Object} params.config - Configuración de puntos a usar
   * @param {string} params.clientId - ID del cliente
   * @param {string} params.branchId - ID de la sucursal
   * @param {string} params.orderId - ID de la orden
   * @param {number} params.orderTotal - Total de la orden
   * @param {string} params.registeredBy - ID del usuario que registra
   * @param {string} params.source - Fuente de configuración ('global' o 'branch')
   * @param {string} params.descriptionSuffix - Sufijo para la descripción
   * @param {string} params.companyId - ID de la empresa (opcional)
   * @returns {Object} Resultado con total de puntos y detalles
   */
  async processConfigPoints({ 
    config, 
    clientId, 
    branchId, 
    orderId, 
    orderTotal, 
    registeredBy, 
    source = "branch", 
    descriptionSuffix = "", 
    companyId = null 
  }) {
    const details = [];
    let total = 0;

    // 1. Puntos por total de compra
    const purchasePoints = this.calculatePurchaseAmountPoints(orderTotal, config);
    if (purchasePoints > 0) {
      const result = await this.addPointsToClient({
        clientId,
        points: purchasePoints,
        type: "earned",
        reason: "purchase_amount",
        branchId,
        orderId,
        description: `Puntos por compra de $${orderTotal.toFixed(2)}${descriptionSuffix}`,
        registeredBy,
        configSource: source,
        companyId
      });

      if (result.success) {
        total += purchasePoints;
        details.push({
          reason: "purchase_amount",
          points: purchasePoints,
          source,
          description: `Puntos por total de compra${descriptionSuffix}`
        });
      }
    }

    // 2. Puntos por compras acumuladas
    const isGlobalConfig = source === "global";
    const accumulatedPoints = await this.calculateAccumulatedPurchasesPoints(
      clientId,
      branchId,
      config,
      isGlobalConfig
    );
    if (accumulatedPoints > 0) {
      const result = await this.addPointsToClient({
        clientId,
        points: accumulatedPoints,
        type: "earned",
        reason: "accumulated_purchases",
        branchId,
        orderId,
        description: `Bono por alcanzar ${config.pointsPerAccumulatedPurchases.purchasesRequired} compras${descriptionSuffix}`,
        registeredBy,
        configSource: source,
        companyId
      });

      if (result.success) {
        total += accumulatedPoints;
        details.push({
          reason: "accumulated_purchases",
          points: accumulatedPoints,
          source,
          description: `Puntos por compras acumuladas${descriptionSuffix}`
        });
      }
    }

    // 3. Puntos por primera compra
    if (config.pointsForFirstPurchase?.enabled) {
      let isFirstPurchase = false;
      
      if (source === "branch") {
        // Config SUCURSAL: verificar primera compra en ESTA sucursal
        isFirstPurchase = await this.isFirstPurchase(clientId, branchId);
      } else if (source === "global") {
        // Config GLOBAL: verificar primera compra en TODA LA EMPRESA
        isFirstPurchase = await this.isFirstPurchaseInCompany(clientId, companyId);
      }
      
      if (isFirstPurchase && config.pointsForFirstPurchase.points > 0) {
        const firstPurchasePoints = config.pointsForFirstPurchase.points;
        const result = await this.addPointsToClient({
          clientId,
          points: firstPurchasePoints,
          type: "earned",
          reason: "first_purchase",
          branchId,
          orderId,
          description: `Bono por primera compra${descriptionSuffix}`,
          registeredBy,
          configSource: source,
          companyId
        });

        if (result.success) {
          total += firstPurchasePoints;
          details.push({
            reason: "first_purchase",
            points: firstPurchasePoints,
            source,
            description: `Puntos por primera compra${descriptionSuffix}`
          });
        }
      }
    }

    // 4. Puntos por visita a sucursal
    if (config.pointsForBranchVisit?.enabled) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      let visitQuery = {
        "clientInfo.clientId": clientId,
        createdAt: { $gte: todayStart },
        status: { $ne: "cancelado" }
      };
      
      // Determinar scope de la visita según la configuración
      if (source === "branch") {
        // Config SUCURSAL: contar visitas solo a ESTA sucursal
        visitQuery.branchId = branchId;
      } else if (source === "global") {
        // Config GLOBAL: contar visitas a CUALQUIER sucursal de la empresa
        const branches = await Branch.find({ companyId }).select('_id');
        const branchIds = branches.map(b => b._id);
        visitQuery.branchId = { $in: branchIds };
      }
      
      const visitsToday = await Order.countDocuments(visitQuery);
      
      // Si no excede el límite de visitas diarias
      if (visitsToday <= config.pointsForBranchVisit.maxVisitsPerDay) {
        const visitPoints = config.pointsForBranchVisit.points;
        const result = await this.addPointsToClient({
          clientId,
          points: visitPoints,
          type: "earned",
          reason: "branch_visit",
          branchId,
          orderId,
          description: `Puntos por visita del día${descriptionSuffix}`,
          registeredBy,
          configSource: source,
          companyId
        });

        if (result.success) {
          total += visitPoints;
          details.push({
            reason: "branch_visit",
            points: visitPoints,
            source,
            description: `Puntos por visita${descriptionSuffix}`
          });
        }
      }
    }

    // Nota: pointsForClientRegistration NO se procesa aquí, solo al registrar cliente

    return { total, details };
  },

  /**
   * Procesa los puntos para una orden creada
   * Incluye todas las opciones de configuración de puntos (excepto registro de cliente)
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

    // Obtener AMBAS configuraciones (global y sucursal)
    const configs = await this.getPointsConfigs(branchId);
    
    // Si no hay ninguna configuración, retornar sin puntos
    if (!configs.global && !configs.branch) {
      console.log("No hay configuración de puntos activa para la sucursal ni empresa:", branchId);
      return { success: true, totalPoints: 0, details: [], message: "Sin configuración de puntos" };
    }

    const details = [];
    let totalPoints = 0;
    const configsUsed = [];

    // Obtener el companyId de la sucursal para los registros
    let companyId = null;
    try {
      const branch = await Branch.findById(branchId);
      companyId = branch?.companyId || null;
    } catch (error) {
      console.error("Error obteniendo companyId:", error);
    }

    // Procesar configuración GLOBAL si existe
    if (configs.global) {
      console.error("📊 Procesando configuración GLOBAL de puntos (ID:", configs.global._id, ")");
      const globalResult = await this.processConfigPoints({
        config: configs.global,
        clientId,
        branchId,
        orderId,
        orderTotal,
        registeredBy,
        source: "global",
        descriptionSuffix: " (Config. Empresa)",
        companyId
      });

      console.error(`✅ Puntos globales calculados: ${globalResult.total}`);
      totalPoints += globalResult.total;
      details.push(...globalResult.details);
      configsUsed.push({ type: "global", id: configs.global._id });
    } else {
      console.error("❌ NO hay configuración GLOBAL disponible");
    }

    // Procesar configuración de SUCURSAL si existe
    if (configs.branch) {
      console.error("📊 Procesando configuración de SUCURSAL de puntos (ID:", configs.branch._id, ")");
      const branchResult = await this.processConfigPoints({
        config: configs.branch,
        clientId,
        branchId,
        orderId,
        orderTotal,
        registeredBy,
        source: "branch",
        descriptionSuffix: " (Config. Sucursal)",
        companyId
      });

      console.error(`✅ Puntos sucursal calculados: ${branchResult.total}`);
      totalPoints += branchResult.total;
      details.push(...branchResult.details);
      configsUsed.push({ type: "branch", id: configs.branch._id });
    } else {
      console.error("❌ NO hay configuración de SUCURSAL disponible");
    }

    console.error(`✅ [Puntos Procesados] Total: ${totalPoints} puntos de ${configsUsed.length} configuracion(es)`);

    return {
      success: true,
      totalPoints,
      details,
      configsUsed,
    };
  },

  /**
   * Procesa puntos por registro de cliente
   * @param {Object} params - Parámetros
   * @param {string} params.clientId - ID del cliente
   * @param {string} params.branchId - ID de la sucursal (o empresa para compatibilidad)
   * @param {string} params.registeredBy - ID del usuario que registra
   * @param {string} params.companyId - ID de la empresa (opcional, se obtiene de la sucursal si no se pasa)
   * @returns {Object} Resultado
   */
  async processRegistrationPoints({ clientId, branchId, registeredBy, companyId = null }) {
    if (!clientId) {
      return { success: false, points: 0, message: "Cliente no especificado" };
    }

    let totalPoints = 0;
    const details = [];
    let actualBranchId = branchId;
    let actualCompanyId = companyId;

    // Si se pasa una empresa como branchId (para compatibilidad), obtener una sucursal de esa empresa
    // Esto es para manejar el caso donde clientController pasa company como branchId
    if (branchId && !companyId) {
      // Verificar si es una sucursal válida
      const branch = await Branch.findById(branchId).catch(() => null);
      if (branch) {
        actualBranchId = branchId;
        actualCompanyId = branch.companyId;
      } else {
        // Podría ser un companyId pasado como branchId (compatibilidad)
        // Buscar la primera sucursal de esta empresa
        const firstBranch = await Branch.findOne({ companyId: branchId });
        if (firstBranch) {
          actualBranchId = firstBranch._id;
          actualCompanyId = branchId;
        } else {
          return { success: true, points: 0, message: "No se encontró sucursal válida" };
        }
      }
    }

    // Obtener AMBAS configuraciones
    const configs = await this.getPointsConfigs(actualBranchId);
    
    if (!configs.global && !configs.branch) {
      return { success: true, points: 0, message: "Sin configuración de puntos" };
    }

    // Procesar configuración GLOBAL si existe
    if (configs.global) {
      const globalPoints = this.calculateRegistrationPoints(configs.global);
      if (globalPoints > 0) {
        const result = await this.addPointsToClient({
          clientId,
          points: globalPoints,
          type: "earned",
          reason: "client_registration",
          branchId: actualBranchId,
          companyId: actualCompanyId,
          description: "Puntos de bienvenida por registro (Config. Empresa)",
          registeredBy,
          configSource: "global"
        });

        if (result.success) {
          totalPoints += globalPoints;
          details.push({
            source: "global",
            points: globalPoints,
            description: "Puntos por registro (Config. Empresa)"
          });
        }
      }
    }

    // Procesar configuración de SUCURSAL si existe
    if (configs.branch) {
      const branchPoints = this.calculateRegistrationPoints(configs.branch);
      if (branchPoints > 0) {
        const result = await this.addPointsToClient({
          clientId,
          points: branchPoints,
          type: "earned",
          reason: "client_registration",
          branchId: actualBranchId,
          companyId: actualCompanyId,
          description: "Puntos de bienvenida por registro (Config. Sucursal)",
          registeredBy,
          configSource: "branch"
        });

        if (result.success) {
          totalPoints += branchPoints;
          details.push({
            source: "branch",
            points: branchPoints,
            description: "Puntos por registro (Config. Sucursal)"
          });
        }
      }
    }

    // Obtener el balance actual del cliente
    const client = await Client.findById(clientId);
    const newBalance = client?.points || 0;

    return {
      success: true,
      points: totalPoints,
      newBalance,
      details
    };
  },

  /**
   * Procesa puntos por registro de cliente SOLO con configuración global de empresa
   * @param {Object} params - Parámetros
   * @param {string} params.clientId - ID del cliente
   * @param {string} params.companyId - ID de la empresa
   * @param {string} params.registeredBy - ID del usuario que registra
   * @returns {Object} Resultado
   */
  async processRegistrationPointsForCompany({ clientId, companyId, registeredBy }) {
    if (!clientId || !companyId) {
      return { success: false, points: 0, message: "Cliente y empresa son requeridos" };
    }

    // Obtener SOLO configuración global de la empresa
    const globalConfig = await PointsConfig.findOne({
      company: companyId,
      isGlobal: true,
      status: true,
    });
    
    if (!globalConfig) {
      return { success: true, points: 0, message: "Sin configuración global de puntos" };
    }

    // Calcular puntos solo de configuración global
    const globalPoints = this.calculateRegistrationPoints(globalConfig);
    if (globalPoints <= 0) {
      return { success: true, points: 0, message: "Configuración global sin puntos por registro" };
    }

    // Obtener primera sucursal de la empresa para el registro (requerido para historial)
    const firstBranch = await Branch.findOne({ companyId: companyId });
    if (!firstBranch) {
      return { success: true, points: 0, message: "No se encontró sucursal en la empresa" };
    }

    // Aplicar puntos SOLO de configuración global
    const result = await this.addPointsToClient({
      clientId,
      points: globalPoints,
      type: "earned",
      reason: "client_registration",
      branchId: firstBranch._id, // Para referencia en historial
      companyId: companyId,
      description: "Puntos de bienvenida por registro (Config. Global Empresa)",
      registeredBy,
      configSource: "global"
    });

    if (result.success) {
      console.log(`✅ [Registro Cliente] Puntos globales otorgados: ${globalPoints} pts (Solo config. empresa)`);
      return {
        success: true,
        points: globalPoints,
        newBalance: result.newBalance,
        details: [{
          source: "global",
          points: globalPoints,
          description: "Puntos por registro (Solo Config. Global Empresa)"
        }]
      };
    }

    return { success: false, points: 0, message: "Error al aplicar puntos globales" };
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

  /**
   * Alias para addPointsToClient - usado por el scanner
   * @param {Object} params - Mismos parámetros que addPointsToClient
   * @returns {Object} Resultado con cliente actualizado e historial
   */
  async addPointsHistory(params) {
    return this.addPointsToClient(params);
  },
};

export default clientPointsService;
