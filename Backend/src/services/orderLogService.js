import OrderLog from '../models/OrderLog.js';

/**
 * Servicio para gestionar logs de órdenes
 */
class OrderLogService {
  /**
   * Crea un nuevo log de evento para una orden
   * @param {string} orderId - ID de la orden
   * @param {string} eventType - Tipo de evento
   * @param {string} description - Descripción del evento
   * @param {string} userId - ID del usuario que realizó la acción
   * @param {string} userName - Nombre del usuario
   * @param {string} userRole - Rol del usuario
   * @param {object} metadata - Datos adicionales específicos del evento (opcional)
   * @returns {Promise<OrderLog>} - Log creado
   */
  async createLog(orderId, eventType, description, userId, userName, userRole, metadata = {}) {
    try {
      const log = new OrderLog({
        orderId,
        eventType,
        description,
        userId,
        userName,
        userRole,
        metadata,
        timestamp: new Date()
      });

      const savedLog = await log.save();
      return savedLog;
    } catch (error) {
      console.error('Error al crear log de orden:', error);
      // No lanzar error para no bloquear la operación principal
      // Solo registrar en consola para debugging
      return null;
    }
  }

  /**
   * Obtiene todos los logs de una orden específica
   * @param {string} orderId - ID de la orden
   * @param {object} filters - Filtros opcionales (page, limit, eventType, startDate, endDate)
   * @returns {Promise<{logs: OrderLog[], total: number, page: number, pages: number}>}
   */
  async getOrderLogs(orderId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        eventType,
        startDate,
        endDate
      } = filters;

      // Construir query
      const query = { orderId };

      if (eventType) {
        query.eventType = eventType;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Ejecutar consulta con paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [logs, total] = await Promise.all([
        OrderLog.find(query)
          .populate('userId', 'name email profile')
          .sort({ timestamp: -1 }) // Más recientes primero
          .skip(skip)
          .limit(parseInt(limit)),
        OrderLog.countDocuments(query)
      ]);

      const pages = Math.ceil(total / parseInt(limit));

      return {
        logs,
        total,
        page: parseInt(page),
        pages
      };
    } catch (error) {
      console.error('Error al obtener logs de orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene un log específico por ID
   * @param {string} logId - ID del log
   * @returns {Promise<OrderLog>}
   */
  async getLogById(logId) {
    try {
      const log = await OrderLog.findById(logId)
        .populate('userId', 'name email profile')
        .populate('orderId', 'orderNumber status');

      return log;
    } catch (error) {
      console.error('Error al obtener log por ID:', error);
      throw error;
    }
  }

  /**
   * Elimina todos los logs de una orden (usar con cuidado, solo para testing)
   * @param {string} orderId - ID de la orden
   * @returns {Promise<number>} - Número de logs eliminados
   */
  async deleteOrderLogs(orderId) {
    try {
      const result = await OrderLog.deleteMany({ orderId });
      return result.deletedCount;
    } catch (error) {
      console.error('Error al eliminar logs de orden:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new OrderLogService();
