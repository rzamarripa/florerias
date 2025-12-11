import orderLogService from '../services/orderLogService.js';

/**
 * Obtiene todos los logs de una orden específica
 * GET /api/order-logs/:orderId
 */
export const getOrderLogs = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { page, limit, eventType, startDate, endDate } = req.query;

    const result = await orderLogService.getOrderLogs(orderId, {
      page,
      limit,
      eventType,
      startDate,
      endDate
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: {
        page: result.page,
        limit: parseInt(limit) || 50,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error) {
    console.error('Error al obtener logs de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene un log específico por ID
 * GET /api/order-logs/log/:logId
 */
export const getOrderLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await orderLogService.getLogById(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error al obtener log:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
