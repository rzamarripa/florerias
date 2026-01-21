import { PointsReward } from "../models/PointsReward.js";
import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";

export const getAllPointsRewards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    if (req.query.branchId) {
      filters.branch = req.query.branchId;
    }

    if (req.query.companyId) {
      filters.company = req.query.companyId;
    }

    if (req.query.isGlobal !== undefined) {
      filters.isGlobal = req.query.isGlobal === "true";
    }

    if (req.query.status !== undefined) {
      filters.status = req.query.status === "true";
    }

    if (req.query.rewardType) {
      filters.rewardType = req.query.rewardType;
    }

    const pointsRewards = await PointsReward.find(filters)
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion")
      .skip(skip)
      .limit(limit)
      .sort({ pointsRequired: 1 });

    const total = await PointsReward.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: pointsRewards.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: pointsRewards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPointsReward = async (req, res) => {
  try {
    const {
      name,
      description,
      pointsRequired,
      rewardType,
      rewardValue,
      isProducto,
      productId,
      productQuantity,
      isPercentage,
      maxRedemptionsPerClient,
      maxTotalRedemptions,
      validFrom,
      validUntil,
      branch,
      company,
      isGlobal,
      status,
    } = req.body;

    if (!name || !pointsRequired) {
      return res.status(400).json({
        success: false,
        message: "Nombre y puntos requeridos son obligatorios",
      });
    }

    // Validar que solo recompensas canjeables (isProducto: false) puedan ser globales
    if (isGlobal && isProducto) {
      return res.status(400).json({
        success: false,
        message: "Los productos como recompensa no pueden ser globales, deben ser específicos de sucursal",
      });
    }

    // Validar según si es global o específico
    if (isGlobal) {
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "La empresa es requerida para recompensas globales",
        });
      }

      const companyExists = await Company.findById(company);
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: "La empresa no existe",
        });
      }
    } else {
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "La sucursal es requerida para recompensas específicas",
        });
      }

      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(404).json({
          success: false,
          message: "La sucursal no existe",
        });
      }
    }

    const rewardData = {
      name,
      description: description || "",
      pointsRequired,
      rewardType: rewardType || "discount",
      rewardValue: rewardValue || 0,
      isProducto: isProducto || false,
      productId: productId || null,
      productQuantity: productQuantity || 1,
      isPercentage: isPercentage || false,
      maxRedemptionsPerClient: maxRedemptionsPerClient || 0,
      maxTotalRedemptions: maxTotalRedemptions || 0,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      isGlobal: isGlobal || false,
      company: isGlobal ? company : null,
      branch: !isGlobal ? branch : null,
      status: status !== undefined ? status : true,
    };

    const pointsReward = await PointsReward.create(rewardData);
    const populatedReward = await PointsReward.findById(pointsReward._id)
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion");

    res.status(201).json({
      success: true,
      message: "Recompensa creada exitosamente",
      data: populatedReward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPointsRewardById = async (req, res) => {
  try {
    const pointsReward = await PointsReward.findById(req.params.id)
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion");

    if (!pointsReward) {
      return res.status(404).json({
        success: false,
        message: "Recompensa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: pointsReward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPointsRewardsByBranch = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const includeGlobal = req.query.includeGlobal === "true"; // Parámetro opcional para incluir globales

    const branchId = req.params.branchId;

    // Obtener la sucursal para conocer su empresa
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    const statusFilter = req.query.status !== undefined ? { status: req.query.status === "true" } : {};

    // Buscar recompensas específicas de la sucursal
    const branchRewards = await PointsReward.find({
      branch: branchId,
      isGlobal: false,
      ...statusFilter
    })
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion");

    // Buscar recompensas globales de la empresa SOLO si se solicita explícitamente
    let globalRewards = [];
    if (includeGlobal && branch.companyId) {
      globalRewards = await PointsReward.find({
        company: branch.companyId,
        isGlobal: true,
        ...statusFilter
      })
        .populate("branch", "branchName address")
        .populate("company", "name")
        .populate("productId", "nombre imagen totalVenta descripcion");
    }

    // Combinar ambas listas
    const allRewards = [...branchRewards, ...globalRewards];

    // Ordenar por puntos requeridos
    allRewards.sort((a, b) => a.pointsRequired - b.pointsRequired);

    // Aplicar paginación manualmente
    const total = allRewards.length;
    const paginatedRewards = allRewards.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: paginatedRewards.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: paginatedRewards,
      meta: {
        branchRewards: branchRewards.length,
        globalRewards: globalRewards.length,
        totalCombined: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePointsReward = async (req, res) => {
  try {
    const {
      name,
      description,
      pointsRequired,
      rewardType,
      rewardValue,
      isProducto,
      productId,
      productQuantity,
      isPercentage,
      maxRedemptionsPerClient,
      maxTotalRedemptions,
      validFrom,
      validUntil,
      status,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (pointsRequired !== undefined) updateData.pointsRequired = pointsRequired;
    if (rewardType !== undefined) updateData.rewardType = rewardType;
    if (rewardValue !== undefined) updateData.rewardValue = rewardValue;
    if (isProducto !== undefined) updateData.isProducto = isProducto;
    if (productId !== undefined) updateData.productId = productId;
    if (productQuantity !== undefined) updateData.productQuantity = productQuantity;
    if (isPercentage !== undefined) updateData.isPercentage = isPercentage;
    if (maxRedemptionsPerClient !== undefined) updateData.maxRedemptionsPerClient = maxRedemptionsPerClient;
    if (maxTotalRedemptions !== undefined) updateData.maxTotalRedemptions = maxTotalRedemptions;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (validUntil !== undefined) updateData.validUntil = validUntil;
    if (status !== undefined) updateData.status = status;

    const pointsReward = await PointsReward.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion");

    if (!pointsReward) {
      return res.status(404).json({
        success: false,
        message: "Recompensa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recompensa actualizada exitosamente",
      data: pointsReward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePointsReward = async (req, res) => {
  try {
    const pointsReward = await PointsReward.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    )
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion");

    if (!pointsReward) {
      return res.status(404).json({
        success: false,
        message: "Recompensa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recompensa desactivada exitosamente",
      data: pointsReward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activatePointsReward = async (req, res) => {
  try {
    const pointsReward = await PointsReward.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    )
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion");

    if (!pointsReward) {
      return res.status(404).json({
        success: false,
        message: "Recompensa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recompensa activada exitosamente",
      data: pointsReward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPointsRewardsByCompany = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status !== undefined ? { status: req.query.status === "true" } : {};

    const pointsRewards = await PointsReward.find({
      company: req.params.companyId,
      isGlobal: true,
      ...statusFilter
    })
      .populate("branch", "branchName address")
      .populate("company", "name")
      .populate("productId", "nombre imagen totalVenta descripcion")
      .skip(skip)
      .limit(limit)
      .sort({ pointsRequired: 1 });

    const total = await PointsReward.countDocuments({
      company: req.params.companyId,
      isGlobal: true,
      ...statusFilter
    });

    res.status(200).json({
      success: true,
      count: pointsRewards.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: pointsRewards,
      message: pointsRewards.length > 0
        ? "Recompensas globales encontradas"
        : "No hay recompensas globales activas"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
