import { PointsConfig } from "../models/PointsConfig.js";
import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";

export const getAllPointsConfigs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    // Filtro por sucursal
    if (req.query.branchId) {
      filters.branch = req.query.branchId;
    }

    // Filtro por empresa
    if (req.query.companyId) {
      filters.company = req.query.companyId;
    }

    // Filtro por tipo (global o específico)
    if (req.query.isGlobal !== undefined) {
      filters.isGlobal = req.query.isGlobal === "true";
    }

    // Filtro por estado
    if (req.query.status !== undefined) {
      filters.status = req.query.status === "true";
    }

    const pointsConfigs = await PointsConfig.find(filters)
      .populate("branch", "branchName branchCode")
      .populate("company", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await PointsConfig.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: pointsConfigs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: pointsConfigs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPointsConfig = async (req, res) => {
  try {
    const {
      pointsPerPurchaseAmount,
      pointsPerAccumulatedPurchases,
      pointsForFirstPurchase,
      pointsForClientRegistration,
      pointsForBranchVisit,
      branch,
      company,
      isGlobal,
      status,
    } = req.body;

    // Validar según si es global o específico
    if (isGlobal) {
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "La empresa es requerida para configuración global",
        });
      }

      const companyExists = await Company.findById(company);
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: "La empresa no existe",
        });
      }

      const existingConfig = await PointsConfig.findOne({ company, isGlobal: true });
      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una configuración global de puntos para esta empresa",
        });
      }
    } else {
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "La sucursal es requerida para configuración específica",
        });
      }

      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(404).json({
          success: false,
          message: "La sucursal no existe",
        });
      }

      const existingConfig = await PointsConfig.findOne({ branch, isGlobal: false });
      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una configuración de puntos para esta sucursal",
        });
      }
    }

    const pointsConfigData = {
      pointsPerPurchaseAmount: pointsPerPurchaseAmount || {
        enabled: true,
        amount: 100,
        points: 1,
      },
      pointsPerAccumulatedPurchases: pointsPerAccumulatedPurchases || {
        enabled: false,
        purchasesRequired: 5,
        points: 10,
      },
      pointsForFirstPurchase: pointsForFirstPurchase || {
        enabled: true,
        points: 5,
      },
      pointsForClientRegistration: pointsForClientRegistration || {
        enabled: true,
        points: 10,
      },
      pointsForBranchVisit: pointsForBranchVisit || {
        enabled: false,
        points: 2,
        maxVisitsPerDay: 1,
      },
      isGlobal: isGlobal || false,
      company: isGlobal ? company : null,
      branch: !isGlobal ? branch : null,
      status: status !== undefined ? status : true,
    };

    const pointsConfig = await PointsConfig.create(pointsConfigData);
    const populatedConfig = await PointsConfig.findById(pointsConfig._id)
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    res.status(201).json({
      success: true,
      message: "Configuración de puntos creada exitosamente",
      data: populatedConfig,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una configuración de puntos para esta sucursal",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPointsConfigById = async (req, res) => {
  try {
    const pointsConfig = await PointsConfig.findById(req.params.id)
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    if (!pointsConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuración de puntos no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: pointsConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPointsConfigByBranch = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    
    // Buscar configuración por sucursal (SIN filtro isGlobal)
    let pointsConfig = await PointsConfig.findOne({
      branch: branchId,
      status: true,
    })
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    // Si no hay configuración de sucursal, buscar global
    if (!pointsConfig) {
      const branch = await Branch.findById(branchId);
      if (branch && branch.companyId) {
        pointsConfig = await PointsConfig.findOne({
          company: branch.companyId,
          isGlobal: true,
          status: true,
        })
          .populate("branch", "branchName branchCode")
          .populate("company", "name");
      }
    }

    // IMPORTANTE: Devolver 200 con data: null en lugar de 404
    // Esto evita errores en la consola del frontend
    res.status(200).json({
      success: true,
      data: pointsConfig || null,
      message: pointsConfig 
        ? "Configuración encontrada" 
        : "No hay configuración de puntos activa"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPointsConfigByCompany = async (req, res) => {
  try {
    const pointsConfig = await PointsConfig.findOne({
      company: req.params.companyId,
      isGlobal: true,
      status: true,
    })
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    // Devolver 200 con data: null en lugar de 404
    res.status(200).json({
      success: true,
      data: pointsConfig || null,
      message: pointsConfig 
        ? "Configuración global encontrada" 
        : "No hay configuración global de puntos activa"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePointsConfig = async (req, res) => {
  try {
    const {
      pointsPerPurchaseAmount,
      pointsPerAccumulatedPurchases,
      pointsForFirstPurchase,
      pointsForClientRegistration,
      pointsForBranchVisit,
      status,
    } = req.body;

    const updateData = {};

    if (pointsPerPurchaseAmount !== undefined) {
      updateData.pointsPerPurchaseAmount = pointsPerPurchaseAmount;
    }
    if (pointsPerAccumulatedPurchases !== undefined) {
      updateData.pointsPerAccumulatedPurchases = pointsPerAccumulatedPurchases;
    }
    if (pointsForFirstPurchase !== undefined) {
      updateData.pointsForFirstPurchase = pointsForFirstPurchase;
    }
    if (pointsForClientRegistration !== undefined) {
      updateData.pointsForClientRegistration = pointsForClientRegistration;
    }
    if (pointsForBranchVisit !== undefined) {
      updateData.pointsForBranchVisit = pointsForBranchVisit;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const pointsConfig = await PointsConfig.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    if (!pointsConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuración de puntos no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Configuración de puntos actualizada exitosamente",
      data: pointsConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePointsConfig = async (req, res) => {
  try {
    const pointsConfig = await PointsConfig.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    if (!pointsConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuración de puntos no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Configuración de puntos desactivada exitosamente",
      data: pointsConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activatePointsConfig = async (req, res) => {
  try {
    const pointsConfig = await PointsConfig.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "name");

    if (!pointsConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuración de puntos no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Configuración de puntos activada exitosamente",
      data: pointsConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
