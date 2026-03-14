import { UserSessionLog } from "../models/UserSessionLog.js";
import { Company } from "../models/Company.js";
import { Branch } from "../models/Branch.js";
import mongoose from "mongoose";

export const createSessionLog = async (userId, roleName) => {
  try {
    let companyId = null;

    if (roleName === "Administrador") {
      const company = await Company.findOne({ administrator: userId });
      companyId = company?._id || null;
    } else if (roleName === "Gerente") {
      const branch = await Branch.findOne({ manager: userId });
      if (branch) {
        const company = await Company.findOne({ branches: branch._id });
        companyId = company?._id || null;
      }
    } else {
      const branch = await Branch.findOne({ employees: userId });
      if (branch) {
        const company = await Company.findOne({ branches: branch._id });
        companyId = company?._id || null;
      }
    }

    if (!companyId) {
      console.warn(`[UserSessionLog] No se pudo resolver companyId para userId: ${userId}, rol: ${roleName}`);
      return null;
    }

    // Close any existing open sessions for this user
    await UserSessionLog.updateMany(
      { userId, isOpen: true },
      { isOpen: false, logoutAt: new Date() }
    );

    const sessionLog = await UserSessionLog.create({
      userId,
      companyId,
    });

    return sessionLog;
  } catch (error) {
    console.error("[UserSessionLog] Error creando session log:", error.message);
    return null;
  }
};

export const getCompaniesSessionSummary = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).lean();

    const companyIds = companies.map((c) => c._id);

    // Aggregate total session hours per company
    const sessionStats = await UserSessionLog.aggregate([
      { $match: { companyId: { $in: companyIds } } },
      {
        $group: {
          _id: "$companyId",
          totalClosedMs: {
            $sum: {
              $cond: [
                { $eq: ["$isOpen", false] },
                { $subtract: ["$logoutAt", "$loginAt"] },
                0,
              ],
            },
          },
          totalOpenMs: {
            $sum: {
              $cond: [
                { $eq: ["$isOpen", true] },
                { $subtract: [new Date(), "$loginAt"] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsMap = new Map();
    for (const stat of sessionStats) {
      const totalMs = stat.totalClosedMs + stat.totalOpenMs;
      statsMap.set(stat._id.toString(), +(totalMs / 3600000).toFixed(2));
    }

    const result = companies.map((company) => ({
      _id: company._id,
      legalName: company.legalName,
      tradeName: company.tradeName,
      logoUrl: company.logoUrl,
      totalSessionHours: statsMap.get(company._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCompanyBranchesSessionStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId)
      .populate({
        path: "branches",
        populate: [
          { path: "employees", select: "_id" },
          { path: "manager", select: "_id" },
        ],
      })
      .lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    const now = new Date();
    const branches = company.branches || [];

    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const employeeIds = (branch.employees || []).map((e) =>
          e._id ? e._id : e
        );
        if (branch.manager) {
          const managerId = branch.manager._id ? branch.manager._id : branch.manager;
          employeeIds.push(managerId);
        }

        if (employeeIds.length === 0) {
          return {
            _id: branch._id,
            branchName: branch.branchName,
            branchCode: branch.branchCode,
            totalHours: 0,
            closedSessionHours: 0,
            activeSessionHours: 0,
          };
        }

        const [stats] = await UserSessionLog.aggregate([
          {
            $match: {
              userId: { $in: employeeIds.map((id) => new mongoose.Types.ObjectId(id)) },
            },
          },
          {
            $group: {
              _id: null,
              closedMs: {
                $sum: {
                  $cond: [
                    { $eq: ["$isOpen", false] },
                    { $subtract: ["$logoutAt", "$loginAt"] },
                    0,
                  ],
                },
              },
              activeMs: {
                $sum: {
                  $cond: [
                    { $eq: ["$isOpen", true] },
                    { $subtract: [now, "$loginAt"] },
                    0,
                  ],
                },
              },
            },
          },
        ]);

        const closedMs = stats?.closedMs || 0;
        const activeMs = stats?.activeMs || 0;
        const totalMs = closedMs + activeMs;

        return {
          _id: branch._id,
          branchName: branch.branchName,
          branchCode: branch.branchCode,
          totalHours: +(totalMs / 3600000).toFixed(2),
          closedSessionHours: +(closedMs / 3600000).toFixed(2),
          activeSessionHours: +(activeMs / 3600000).toFixed(2),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        companyName: company.tradeName || company.legalName,
        branches: branchStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBranchUsersSessionDetails = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId)
      .populate({
        path: "employees",
        select: "username email profile role",
        populate: { path: "role", select: "name" },
      })
      .populate({
        path: "manager",
        select: "username email profile role",
        populate: { path: "role", select: "name" },
      })
      .lean();

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    const employees = branch.employees || [];
    const allUsers = [];
    if (branch.manager) {
      allUsers.push({ ...branch.manager, isManager: true });
    }
    for (const emp of employees) {
      allUsers.push({ ...emp, isManager: false });
    }

    if (allUsers.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const userIds = allUsers.map((u) => new mongoose.Types.ObjectId(u._id));
    const now = new Date();

    const sessionStats = await UserSessionLog.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          totalUsageMs: {
            $sum: {
              $cond: [
                { $eq: ["$isOpen", false] },
                { $subtract: ["$logoutAt", "$loginAt"] },
                { $subtract: [now, "$loginAt"] },
              ],
            },
          },
        },
      },
    ]);

    const statsMap = new Map();
    for (const stat of sessionStats) {
      statsMap.set(stat._id.toString(), stat.totalUsageMs);
    }

    const result = allUsers.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      roleName: user.role?.name || "Sin rol",
      isManager: user.isManager,
      totalUsageHours: +(
        (statsMap.get(user._id.toString()) || 0) / 3600000
      ).toFixed(2),
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeSessionLog = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await UserSessionLog.updateMany(
      { userId, isOpen: true },
      { isOpen: false, logoutAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
