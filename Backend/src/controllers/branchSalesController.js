import Order from '../models/Order.js';
import { Branch } from '../models/Branch.js';

// Obtener resumen de ventas para sucursales específicas
export const getBranchesSalesSummary = async (req, res) => {
  try {
    const { branchIds, startDate, endDate } = req.body;

    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de sucursales'
      });
    }

    // Construir filtro de fechas
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endOfDay;
      }
    }

    // Obtener información de las sucursales
    const branches = await Branch.find({ _id: { $in: branchIds } });
    
    // Procesar cada sucursal
    const branchSalesData = await Promise.all(branches.map(async (branch) => {
      // Obtener todas las órdenes de la sucursal en el período
      const orders = await Order.find({
        branchId: branch._id,
        ...dateFilter
      });

      // Calcular totales
      let totalSales = 0;
      let totalDeliveryService = 0;
      let totalPaid = 0;
      let totalOrders = orders.length;

      orders.forEach(order => {
        totalSales += order.total || 0;
        // Sumar el costo de envío si existe
        if (order.deliveryData && order.deliveryData.deliveryPrice) {
          totalDeliveryService += order.deliveryData.deliveryPrice;
        }
        // Sumar pagos (advance + lo pagado)
        totalPaid += order.advance || 0;
        if (order.paidWith > order.advance) {
          totalPaid += (order.paidWith - order.advance);
        }
      });

      // Calcular ventas sin servicio
      const totalSalesWithoutDelivery = totalSales - totalDeliveryService;

      // Obtener porcentajes de la configuración de la sucursal
      const royaltiesPercent = branch.royaltiesPercentage || 0;
      const brandAdvertisingPercent = branch.advertisingBrandPercentage || 0;
      const branchAdvertisingPercent = branch.advertisingBranchPercentage || 0;

      // Calcular montos basados en ventas sin servicio (S/S)
      const royaltiesAmount = (totalSalesWithoutDelivery * royaltiesPercent) / 100;
      const brandAdvertisingAmount = (totalSalesWithoutDelivery * brandAdvertisingPercent) / 100;
      const branchAdvertisingAmount = (totalSalesWithoutDelivery * branchAdvertisingPercent) / 100;

      return {
        branchId: branch._id,
        branchName: branch.branchName,
        branchCode: branch.branchCode || '',
        totalOrders,
        totalSales,
        totalDeliveryService,
        totalSalesWithoutDelivery,
        totalPaid,
        royalties: royaltiesPercent,
        royaltiesAmount,
        brandAdvertising: brandAdvertisingPercent,
        brandAdvertisingAmount,
        branchAdvertising: branchAdvertisingPercent,
        branchAdvertisingAmount
      };
    }));

    res.json({
      success: true,
      data: branchSalesData,
      message: 'Datos de ventas obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error al obtener ventas de sucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos de ventas',
      error: error.message
    });
  }
};