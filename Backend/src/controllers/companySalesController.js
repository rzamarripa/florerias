import { Company } from '../models/Company.js';
import { Branch } from '../models/Branch.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Obtener resumen de ventas por empresa
const getCompaniesSalesSummary = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      onlyFranchises = false
    } = req.query;

    // Obtener el usuario autenticado
    const userId = req.user?._id;
    const user = await mongoose.model('cs_user').findById(userId).populate('role');

    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o sin rol asignado'
      });
    }

    // Construir filtro de empresas
    const companyFilter = {};
    
    // Si se especifica solo franquicias
    if (onlyFranchises === 'true') {
      companyFilter.isFranchise = true;
    }

    // PERMITIR QUE TODOS LOS USUARIOS VEAN DATOS DE FRANQUICIAS
    // Solo aplicar filtros de empresa si NO es una consulta de franquicias
    const userRole = user.role.name;
    if (onlyFranchises !== 'true' && userRole !== 'Administrador') {
      // Para otros roles, buscar empresas donde el usuario esté relacionado
      const branchesAsAdmin = await Branch.find({
        $or: [
          { administrator: userId },
          { manager: userId },
          { employees: userId }
        ]
      }).select('companyId');
      
      const companyIds = [...new Set(branchesAsAdmin.map(b => b.companyId))];
      
      if (companyIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          summary: {
            totalCompanies: 0,
            totalSales: 0,
            totalPaid: 0,
            totalRoyalties: 0,
            totalBrandAdvertising: 0,
            totalBranchAdvertising: 0
          }
        });
      }
      
      companyFilter._id = { $in: companyIds };
    }

    // Obtener empresas con sus sucursales
    const companies = await Company.find(companyFilter)
      .populate('branches')
      .lean();

    if (companies.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        summary: {
          totalCompanies: 0,
          totalSales: 0,
          totalPaid: 0,
          totalRoyalties: 0,
          totalBrandAdvertising: 0,
          totalBranchAdvertising: 0
        }
      });
    }

    // Preparar filtros de fecha para órdenes
    const orderFilter = {
      status: { $ne: 'cancelado' } // Excluir órdenes canceladas
    };

    if (startDate || endDate) {
      orderFilter.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        orderFilter.createdAt.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        orderFilter.createdAt.$lte = end;
      }
    }

    // Procesar cada empresa
    const companySalesData = [];
    let grandTotalSales = 0;
    let grandTotalPaid = 0;
    let grandTotalRoyalties = 0;
    let grandTotalBrandAdvertising = 0;
    let grandTotalBranchAdvertising = 0;

    for (const company of companies) {
      // Obtener todas las sucursales de la empresa
      const branches = await Branch.find({
        companyId: company._id,
        isActive: true
      }).lean();

      if (branches.length === 0) {
        // Si no hay sucursales, incluir la empresa con valores en 0
        companySalesData.push({
          companyId: company._id,
          companyName: company.legalName || company.tradeName,
          isFranchise: company.isFranchise,
          totalBranches: 0,
          totalSales: 0,
          totalPaid: 0,
          royalties: 0,
          royaltiesAmount: 0,
          brandAdvertising: 0,
          brandAdvertisingAmount: 0,
          branchAdvertising: 0,
          branchAdvertisingAmount: 0
        });
        continue;
      }

      // Inicializar totales de la empresa
      let companyTotalSales = 0;
      let companyTotalPaid = 0;
      let companyTotalRoyalties = 0;
      let companyTotalBrandAdvertising = 0;
      let companyTotalBranchAdvertising = 0;

      // Procesar cada sucursal
      for (const branch of branches) {
        // Obtener órdenes de la sucursal
        const branchOrderFilter = {
          ...orderFilter,
          branchId: branch._id
        };

        const orders = await Order.find(branchOrderFilter)
          .select('total advance')
          .lean();

        // Calcular totales de la sucursal
        const branchTotalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const branchTotalPaid = orders.reduce((sum, order) => sum + (order.advance || 0), 0);

        // Acumular totales de la empresa
        companyTotalSales += branchTotalSales;
        companyTotalPaid += branchTotalPaid;

        // Calcular montos según porcentajes de la sucursal
        // Solo si la empresa es franquicia se calculan regalías
        if (company.isFranchise && branch.royaltiesPercentage > 0) {
          const royaltiesAmount = (branchTotalSales * branch.royaltiesPercentage) / 100;
          companyTotalRoyalties += royaltiesAmount;
        }

        // Publicidad de marca
        if (branch.advertisingBrandPercentage > 0) {
          const brandAdvAmount = (branchTotalSales * branch.advertisingBrandPercentage) / 100;
          companyTotalBrandAdvertising += brandAdvAmount;
        }

        // Publicidad de sucursal
        if (branch.advertisingBranchPercentage > 0) {
          const branchAdvAmount = (branchTotalSales * branch.advertisingBranchPercentage) / 100;
          companyTotalBranchAdvertising += branchAdvAmount;
        }
      }

      // Agregar datos de la empresa
      const companyData = {
        companyId: company._id,
        companyName: company.legalName || company.tradeName,
        isFranchise: company.isFranchise,
        totalBranches: branches.length,
        totalSales: companyTotalSales,
        totalPaid: companyTotalPaid,
        // Porcentajes promedio ponderados (basados en ventas)
        royalties: company.isFranchise && companyTotalSales > 0 
          ? (companyTotalRoyalties / companyTotalSales) * 100 
          : 0,
        royaltiesAmount: companyTotalRoyalties,
        brandAdvertising: companyTotalSales > 0 
          ? (companyTotalBrandAdvertising / companyTotalSales) * 100 
          : 0,
        brandAdvertisingAmount: companyTotalBrandAdvertising,
        branchAdvertising: companyTotalSales > 0 
          ? (companyTotalBranchAdvertising / companyTotalSales) * 100 
          : 0,
        branchAdvertisingAmount: companyTotalBranchAdvertising
      };

      companySalesData.push(companyData);

      // Acumular totales generales
      grandTotalSales += companyTotalSales;
      grandTotalPaid += companyTotalPaid;
      grandTotalRoyalties += companyTotalRoyalties;
      grandTotalBrandAdvertising += companyTotalBrandAdvertising;
      grandTotalBranchAdvertising += companyTotalBranchAdvertising;
    }

    // Ordenar por total de ventas descendente
    companySalesData.sort((a, b) => b.totalSales - a.totalSales);

    res.status(200).json({
      success: true,
      data: companySalesData,
      summary: {
        totalCompanies: companySalesData.length,
        totalSales: grandTotalSales,
        totalPaid: grandTotalPaid,
        totalRoyalties: grandTotalRoyalties,
        totalBrandAdvertising: grandTotalBrandAdvertising,
        totalBranchAdvertising: grandTotalBranchAdvertising
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen de ventas por empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener detalle de ventas de una empresa específica
const getCompanySalesDetail = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    // Verificar que la empresa existe
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Obtener todas las sucursales de la empresa
    const branches = await Branch.find({
      companyId: company._id,
      isActive: true
    }).lean();

    // Preparar filtro de órdenes
    const orderFilter = {
      status: { $ne: 'cancelado' }
    };

    if (startDate || endDate) {
      orderFilter.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        orderFilter.createdAt.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        orderFilter.createdAt.$lte = end;
      }
    }

    // Procesar cada sucursal
    const branchesData = [];
    let totalSales = 0;
    let totalPaid = 0;
    let totalRoyalties = 0;
    let totalBrandAdvertising = 0;
    let totalBranchAdvertising = 0;

    for (const branch of branches) {
      // Obtener órdenes de la sucursal
      const branchOrderFilter = {
        ...orderFilter,
        branchId: branch._id
      };

      const orders = await Order.find(branchOrderFilter)
        .select('total advance orderNumber createdAt')
        .lean();

      // Calcular totales de la sucursal
      const branchTotalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const branchTotalPaid = orders.reduce((sum, order) => sum + (order.advance || 0), 0);

      // Calcular montos según porcentajes
      const royaltiesAmount = company.isFranchise && branch.royaltiesPercentage > 0
        ? (branchTotalSales * branch.royaltiesPercentage) / 100
        : 0;

      const brandAdvAmount = branch.advertisingBrandPercentage > 0
        ? (branchTotalSales * branch.advertisingBrandPercentage) / 100
        : 0;

      const branchAdvAmount = branch.advertisingBranchPercentage > 0
        ? (branchTotalSales * branch.advertisingBranchPercentage) / 100
        : 0;

      branchesData.push({
        branchId: branch._id,
        branchName: branch.branchName,
        branchCode: branch.branchCode,
        totalOrders: orders.length,
        totalSales: branchTotalSales,
        totalPaid: branchTotalPaid,
        royaltiesPercentage: branch.royaltiesPercentage,
        royaltiesAmount,
        brandAdvertisingPercentage: branch.advertisingBrandPercentage,
        brandAdvertisingAmount: brandAdvAmount,
        branchAdvertisingPercentage: branch.advertisingBranchPercentage,
        branchAdvertisingAmount: branchAdvAmount
      });

      // Acumular totales
      totalSales += branchTotalSales;
      totalPaid += branchTotalPaid;
      totalRoyalties += royaltiesAmount;
      totalBrandAdvertising += brandAdvAmount;
      totalBranchAdvertising += branchAdvAmount;
    }

    res.status(200).json({
      success: true,
      data: {
        company: {
          _id: company._id,
          name: company.legalName || company.tradeName,
          isFranchise: company.isFranchise
        },
        branches: branchesData,
        summary: {
          totalBranches: branchesData.length,
          totalSales,
          totalPaid,
          totalRoyalties,
          totalBrandAdvertising,
          totalBranchAdvertising
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener detalle de ventas de empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getCompaniesSalesSummary,
  getCompanySalesDetail
};