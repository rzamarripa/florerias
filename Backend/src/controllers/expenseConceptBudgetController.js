import { ExpenseConcept } from "../models/ExpenseConcept.js";
import { Budget } from "../models/Budget.js";
import { InvoicesPackage } from "../models/InvoicesPackpage.js";
import mongoose from "mongoose";

export const getAllExpenseConcepts = async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    const matchFilters = { isActive: true };
    if (departmentId) {
      matchFilters.departmentId = new mongoose.Types.ObjectId(departmentId);
    }
    
    const expenseConcepts = await ExpenseConcept.find(matchFilters)
      .populate('departmentId', 'name')
      .populate('categoryId', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: expenseConcepts
    });

  } catch (error) {
    console.error("Error getting expense concepts:", error);
    res.status(500).json({
      success: false,
      message: "Error getting expense concepts",
      error: error.message
    });
  }
};

export const getBudgetByExpenseConceptId = async (req, res) => {
  try {
    const { expenseConceptId, month } = req.query;
    
    if (!expenseConceptId) {
      return res.status(400).json({
        success: false,
        message: "expenseConceptId is required"
      });
    }

    const currentDate = new Date();
    const defaultMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!/^\d{4}-\d{2}$/.test(defaultMonth)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM"
      });
    }

    const budgetAggregate = await Budget.aggregate([
      {
        $match: {
          expenseConceptId: new mongoose.Types.ObjectId(expenseConceptId),
          month: defaultMonth
        }
      },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: "$assignedAmount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAssigned = budgetAggregate.length > 0 ? budgetAggregate[0].totalAssigned : 0;
    const budgetCount = budgetAggregate.length > 0 ? budgetAggregate[0].count : 0;

    const expenseConcept = await ExpenseConcept.findById(expenseConceptId)
      .populate('departmentId', 'name')
      .populate('categoryId', 'name');

    if (!expenseConcept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        expenseConceptId: expenseConceptId,
        expenseConceptName: expenseConcept.name,
        department: expenseConcept.departmentId?.name || 'N/A',
        category: expenseConcept.categoryId?.name || 'N/A',
        month: defaultMonth,
        totalAssigned: totalAssigned,
        budgetCount: budgetCount
      }
    });

  } catch (error) {
    console.error("Error getting budget by expense concept:", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget by expense concept",
      error: error.message
    });
  }
};

export const getPaidByExpenseConceptId = async (req, res) => {
  try {
    const { expenseConceptId, month } = req.query;
    
    if (!expenseConceptId) {
      return res.status(400).json({
        success: false,
        message: "expenseConceptId is required"
      });
    }

    const currentDate = new Date();
    const defaultMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!/^\d{4}-\d{2}$/.test(defaultMonth)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM"
      });
    }

    // Calculate month range
    const startOfMonth = new Date(`${defaultMonth}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    // Find all packages with status "Pagado" in the specified month
    const paidPackages = await InvoicesPackage.find({
      estatus: "Pagado",
      fechaPago: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    let totalPaid = 0;
    let paymentDetails = [];

    // Process each paid package
    paidPackages.forEach(pkg => {
      // Process facturas (invoices)
      if (pkg.facturas && Array.isArray(pkg.facturas)) {
        pkg.facturas.forEach(factura => {
          // Check if invoice is authorized and matches the expense concept
          if (factura.autorizada === true && 
              factura.conceptoGasto?.id?.toString() === expenseConceptId.toString()) {
            
            const importePagado = typeof factura.importePagado === 'object' && factura.importePagado !== null
              ? parseFloat(factura.importePagado.toString())
              : factura.importePagado || 0;
            
            totalPaid += importePagado;
            
            paymentDetails.push({
              packageId: pkg._id,
              packageFolio: pkg.folio,
              type: "factura",
              invoiceId: factura._id,
              amount: importePagado,
              description: factura.nombreEmisor || 'N/A',
              uuid: factura.uuid || 'N/A'
            });
          }
        });
      }

      // Process pagosEfectivo (cash payments)
      if (pkg.pagosEfectivo && Array.isArray(pkg.pagosEfectivo)) {
        pkg.pagosEfectivo.forEach(pago => {
          // Check if cash payment is authorized and matches the expense concept
          if (pago.autorizada === true && 
              pago.expenseConcept?.toString() === expenseConceptId.toString()) {
            
            const importePagado = typeof pago.importePagado === 'object' && pago.importePagado !== null
              ? parseFloat(pago.importePagado.toString())
              : pago.importePagado || 0;
            
            totalPaid += importePagado;
            
            paymentDetails.push({
              packageId: pkg._id,
              packageFolio: pkg.folio,
              type: "efectivo",
              cashPaymentId: pago._id,
              amount: importePagado,
              description: pago.description || 'Pago en efectivo'
            });
          }
        });
      }
    });

    // Get expense concept info
    const expenseConcept = await ExpenseConcept.findById(expenseConceptId)
      .populate('departmentId', 'name')
      .populate('categoryId', 'name');

    if (!expenseConcept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        expenseConceptId: expenseConceptId,
        expenseConceptName: expenseConcept.name,
        department: expenseConcept.departmentId?.name || 'N/A',
        category: expenseConcept.categoryId?.name || 'N/A',
        month: defaultMonth,
        totalPaid: totalPaid,
        packagesProcessed: paidPackages.length,
        paymentsCount: paymentDetails.length,
        paymentDetails: paymentDetails
      }
    });

  } catch (error) {
    console.error("Error getting paid amount by expense concept:", error);
    res.status(500).json({
      success: false,
      message: "Error getting paid amount by expense concept",
      error: error.message
    });
  }
};

export const getPendingByExpenseConceptId = async (req, res) => {
  try {
    const { expenseConceptId, month } = req.query;
    
    if (!expenseConceptId) {
      return res.status(400).json({
        success: false,
        message: "expenseConceptId is required"
      });
    }

    const currentDate = new Date();
    const defaultMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!/^\d{4}-\d{2}$/.test(defaultMonth)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM"
      });
    }

    // Calculate month range
    const startOfMonth = new Date(`${defaultMonth}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    // Find all packages with status different from "Pagado" in the specified month
    const pendingPackages = await InvoicesPackage.find({
      estatus: { 
        $in: ["Borrador", "Enviado", "Aprobado", "Rechazado", "Cancelado", "Programado", "PorFondear", "Generado"] 
      },
      fechaPago: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    let totalPending = 0;
    let pendingDetails = [];

    // Process each pending package
    pendingPackages.forEach(pkg => {
      // Process facturas (invoices)
      if (pkg.facturas && Array.isArray(pkg.facturas)) {
        pkg.facturas.forEach(factura => {
          // Check if invoice is authorized or pending and matches the expense concept
          if ((factura.autorizada === true || factura.autorizada === null) && 
              factura.conceptoGasto?.id?.toString() === expenseConceptId.toString()) {
            
            const importePagado = typeof factura.importePagado === 'object' && factura.importePagado !== null
              ? parseFloat(factura.importePagado.toString())
              : factura.importePagado || 0;
            
            totalPending += importePagado;
            
            pendingDetails.push({
              packageId: pkg._id,
              packageFolio: pkg.folio,
              packageStatus: pkg.estatus,
              type: "factura",
              invoiceId: factura._id,
              amount: importePagado,
              description: factura.nombreEmisor || 'N/A',
              uuid: factura.uuid || 'N/A',
              authorized: factura.autorizada
            });
          }
        });
      }

      // Process pagosEfectivo (cash payments)
      if (pkg.pagosEfectivo && Array.isArray(pkg.pagosEfectivo)) {
        pkg.pagosEfectivo.forEach(pago => {
          // Check if cash payment is authorized or pending and matches the expense concept
          if ((pago.autorizada === true || pago.autorizada === null) && 
              pago.expenseConcept?.toString() === expenseConceptId.toString()) {
            
            const importePagado = typeof pago.importePagado === 'object' && pago.importePagado !== null
              ? parseFloat(pago.importePagado.toString())
              : pago.importePagado || 0;
            
            totalPending += importePagado;
            
            pendingDetails.push({
              packageId: pkg._id,
              packageFolio: pkg.folio,
              packageStatus: pkg.estatus,
              type: "efectivo",
              cashPaymentId: pago._id,
              amount: importePagado,
              description: pago.description || 'Pago en efectivo',
              authorized: pago.autorizada
            });
          }
        });
      }
    });

    // Get expense concept info
    const expenseConcept = await ExpenseConcept.findById(expenseConceptId)
      .populate('departmentId', 'name')
      .populate('categoryId', 'name');

    if (!expenseConcept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        expenseConceptId: expenseConceptId,
        expenseConceptName: expenseConcept.name,
        department: expenseConcept.departmentId?.name || 'N/A',
        category: expenseConcept.categoryId?.name || 'N/A',
        month: defaultMonth,
        totalPending: totalPending,
        packagesProcessed: pendingPackages.length,
        paymentsCount: pendingDetails.length,
        pendingDetails: pendingDetails
      }
    });

  } catch (error) {
    console.error("Error getting pending amount by expense concept:", error);
    res.status(500).json({
      success: false,
      message: "Error getting pending amount by expense concept",
      error: error.message
    });
  }
}; 