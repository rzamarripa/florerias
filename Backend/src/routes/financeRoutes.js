import express from "express";
import {
  getFinanceStats,
  getIncomeStats,
  getPayments,
  getDiscountedSales,
  getBuysByBranch,
  getExpensesByBranch,
} from "../controllers/financeController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/finance/stats
 * @desc    Obtiene las estadísticas financieras generales
 * @access  Private
 */
router.get("/stats", protect, getFinanceStats);

/**
 * @route   GET /api/finance/income-stats
 * @desc    Obtiene las estadísticas de ingresos por método de pago
 * @access  Private
 */
router.get("/income-stats", protect, getIncomeStats);

/**
 * @route   GET /api/finance/payments
 * @desc    Obtiene el listado de cobros realizados
 * @access  Private
 */
router.get("/payments", protect, getPayments);

/**
 * @route   GET /api/finance/discounted-sales
 * @desc    Obtiene el listado de ventas con descuento
 * @access  Private
 */
router.get("/discounted-sales", protect, getDiscountedSales);

/**
 * @route   GET /api/finance/buys
 * @desc    Obtiene el listado de compras por sucursal
 * @access  Private
 */
router.get("/buys", protect, getBuysByBranch);

/**
 * @route   GET /api/finance/expenses
 * @desc    Obtiene el listado de gastos por sucursal
 * @access  Private
 */
router.get("/expenses", protect, getExpensesByBranch);

export default router;
