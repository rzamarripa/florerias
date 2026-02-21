import mongoose from "mongoose";
import { Review } from "../models/Review.js";

export const getAverageRatings = async (req, res) => {
  try {
    const { productIds } = req.query;
    if (!productIds) {
      return res.status(400).json({
        success: false,
        message: "productIds query parameter es requerido",
      });
    }

    const ids = productIds.split(",").map((id) => new mongoose.Types.ObjectId(id.trim()));

    const averages = await Review.aggregate([
      { $match: { productId: { $in: ids } } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const data = averages.map((a) => ({
      productId: a._id.toString(),
      avgRating: Math.round(a.avgRating * 10) / 10,
      count: a.count,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createReview = async (req, res) => {
  try {
    if (!req.isClient || !req.client) {
      return res.status(403).json({
        success: false,
        message: "Solo los clientes pueden crear reseñas",
      });
    }

    const { orderId, productId, branchId, rating, comment } = req.body;

    if (!orderId || !productId || !branchId || !rating) {
      return res.status(400).json({
        success: false,
        message: "orderId, productId, branchId y rating son requeridos",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "La calificación debe ser entre 1 y 5",
      });
    }

    const existing = await Review.findOne({
      orderId,
      productId,
      clientId: req.client._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Ya dejaste una reseña para este producto en esta orden",
      });
    }

    const review = await Review.create({
      orderId,
      clientId: req.client._id,
      productId,
      branchId,
      rating,
      comment: comment || "",
    });

    res.status(201).json({
      success: true,
      message: "Reseña creada exitosamente",
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya dejaste una reseña para este producto en esta orden",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReviewsByOrder = async (req, res) => {
  try {
    if (!req.isClient || !req.client) {
      return res.status(403).json({
        success: false,
        message: "Solo los clientes pueden consultar sus reseñas",
      });
    }

    const { orderId } = req.params;

    const reviews = await Review.find({
      orderId,
      clientId: req.client._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
