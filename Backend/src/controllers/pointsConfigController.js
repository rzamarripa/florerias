import { PointsConfig } from "../models/PointsConfig.js";
import { Branch } from "../models/Branch.js";

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

    // Filtro por estado
    if (req.query.status !== undefined) {
      filters.status = req.query.status === "true";
    }

    const pointsConfigs = await PointsConfig.find(filters)
      .populate("branch", "name address")
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
      status,
    } = req.body;

    if (!branch) {
      return res.status(400).json({
        success: false,
        message: "La sucursal es requerida",
      });
    }

    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({
        success: false,
        message: "La sucursal no existe",
      });
    }

    const existingConfig = await PointsConfig.findOne({ branch });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una configuración de puntos para esta sucursal",
      });
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
      branch,
      status: status !== undefined ? status : true,
    };

    const pointsConfig = await PointsConfig.create(pointsConfigData);
    const populatedConfig = await PointsConfig.findById(pointsConfig._id).populate(
      "branch",
      "name address"
    );

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
    const pointsConfig = await PointsConfig.findById(req.params.id).populate(
      "branch",
      "name address"
    );

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
    const pointsConfig = await PointsConfig.findOne({
      branch: req.params.branchId,
    }).populate("branch", "name address");

    if (!pointsConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuración de puntos no encontrada para esta sucursal",
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
    ).populate("branch", "name address");

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
    ).populate("branch", "name address");

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
    ).populate("branch", "name address");

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
