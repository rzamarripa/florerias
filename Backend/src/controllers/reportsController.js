import Order from "../models/Order.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";
import { ProductCategory } from "../models/ProductCategory.js";
import mongoose from "mongoose";

// Resuelve las sucursales accesibles según el rol y valida branchId si viene
const resolveAccessibleBranchIds = async (req) => {
  const userId = req.user?._id;
  if (!userId) {
    return { error: { status: 401, message: "Usuario no autenticado" } };
  }

  const currentUser = await User.findById(userId).populate("role");
  if (!currentUser || !currentUser.role) {
    return { error: { status: 403, message: "Usuario no tiene rol asignado" } };
  }

  const userRole = currentUser.role.name;
  let branchIds = [];

  if (userRole === "Administrador" || userRole === "Super Admin") {
    const userBranches = await Branch.find({
      administrator: userId,
      isActive: true,
    }).select("_id");
    branchIds = userBranches.map((b) => b._id);
    // Super Admin sin restricción: si no tiene sucursales como admin, permitir la que envíe
    if (userRole === "Super Admin" && req.query.branchId) {
      branchIds = [new mongoose.Types.ObjectId(req.query.branchId)];
    }
  } else if (userRole === "Gerente") {
    const userBranch = await Branch.findOne({
      manager: userId,
      isActive: true,
    }).select("_id");
    if (userBranch) branchIds = [userBranch._id];
  } else {
    return {
      error: { status: 403, message: "No tienes permisos para consultar reportes" },
    };
  }

  // Si viene un branchId específico, verificar acceso (excepto Super Admin ya resuelto)
  if (req.query.branchId && userRole !== "Super Admin") {
    const specific = new mongoose.Types.ObjectId(req.query.branchId);
    const hasAccess = branchIds.some((id) => id.equals(specific));
    if (!hasAccess) {
      return {
        error: { status: 403, message: "No tienes acceso a esta sucursal" },
      };
    }
    branchIds = [specific];
  }

  return { branchIds };
};

// Construye el rango de fechas normalizando horas
const buildDateRange = (startDate, endDate) => {
  const range = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

// GET /reports/sales-by-product
export const getSalesByProduct = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const resolved = await resolveAccessibleBranchIds(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        success: false,
        message: resolved.error.message,
      });
    }

    const { branchIds } = resolved;
    if (branchIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { rows: [], totals: { quantity: 0, amount: 0 } },
      });
    }

    const match = { branchId: { $in: branchIds }, status: { $ne: "cancelado" } };
    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange) match.createdAt = dateRange;

    const rows = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productId: "$items.productId",
            productName: "$items.productName",
          },
          quantity: { $sum: "$items.quantity" },
          amount: { $sum: "$items.amount" },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id.productId",
          productName: "$_id.productName",
          quantity: 1,
          amount: 1,
          ordersCount: { $size: "$orders" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totals = rows.reduce(
      (acc, r) => {
        acc.quantity += r.quantity || 0;
        acc.amount += r.amount || 0;
        return acc;
      },
      { quantity: 0, amount: 0 }
    );

    return res.status(200).json({
      success: true,
      data: { rows, totals },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        branchIds,
      },
    });
  } catch (error) {
    console.error("Error en getSalesByProduct:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar el reporte",
      error: error.message,
    });
  }
};

// GET /reports/sales-by-category
export const getSalesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const resolved = await resolveAccessibleBranchIds(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        success: false,
        message: resolved.error.message,
      });
    }

    const { branchIds } = resolved;
    if (branchIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { rows: [], totals: { quantity: 0, amount: 0 } },
      });
    }

    const match = { branchId: { $in: branchIds }, status: { $ne: "cancelado" } };
    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange) match.createdAt = dateRange;

    const aggregated = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productCategory",
          quantity: { $sum: "$items.quantity" },
          amount: { $sum: "$items.amount" },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          quantity: 1,
          amount: 1,
          ordersCount: { $size: "$orders" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // Enriquecer con nombres de categoría
    const categoryIds = aggregated
      .map((r) => r.categoryId)
      .filter((id) => id != null);

    const categories = categoryIds.length
      ? await ProductCategory.find({ _id: { $in: categoryIds } }).select("name")
      : [];

    const nameById = new Map(
      categories.map((c) => [c._id.toString(), c.name])
    );

    const rows = aggregated.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryId
        ? nameById.get(r.categoryId.toString()) || "Sin categoría"
        : "Sin categoría",
      quantity: r.quantity,
      amount: r.amount,
      ordersCount: r.ordersCount,
    }));

    const totals = rows.reduce(
      (acc, r) => {
        acc.quantity += r.quantity || 0;
        acc.amount += r.amount || 0;
        return acc;
      },
      { quantity: 0, amount: 0 }
    );

    return res.status(200).json({
      success: true,
      data: { rows, totals },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        branchIds,
      },
    });
  } catch (error) {
    console.error("Error en getSalesByCategory:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar el reporte",
      error: error.message,
    });
  }
};
