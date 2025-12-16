import { PointsReward } from "../models/PointsReward.js";
import { Branch } from "../models/Branch.js";

export const getAllPointsRewards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    if (req.query.branchId) {
      filters.branch = req.query.branchId;
    }

    if (req.query.status !== undefined) {
      filters.status = req.query.status === "true";
    }

    if (req.query.rewardType) {
      filters.rewardType = req.query.rewardType;
    }

    const pointsRewards = await PointsReward.find(filters)
      .populate("branch", "branchName address")
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
      status,
    } = req.body;

    if (!name || !pointsRequired || !branch) {
      return res.status(400).json({
        success: false,
        message: "Nombre, puntos requeridos y sucursal son obligatorios",
      });
    }

    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({
        success: false,
        message: "La sucursal no existe",
      });
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
      branch,
      status: status !== undefined ? status : true,
    };

    const pointsReward = await PointsReward.create(rewardData);
    const populatedReward = await PointsReward.findById(pointsReward._id)
      .populate("branch", "branchName address")
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

    const filters = { branch: req.params.branchId };

    if (req.query.status !== undefined) {
      filters.status = req.query.status === "true";
    }

    const pointsRewards = await PointsReward.find(filters)
      .populate("branch", "branchName address")
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
