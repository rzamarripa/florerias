import mongoose from "mongoose";
const { Schema } = mongoose;

const cardTransactionSchema = new Schema(
  {
    digitalCardId: {
      type: Schema.Types.ObjectId,
      ref: "digital_card",
      required: [true, "La tarjeta digital es requerida"],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: [true, "El cliente es requerido"],
    },
    transactionType: {
      type: String,
      required: true,
      enum: [
        "scan", // Escaneo de tarjeta
        "points_check", // Consulta de puntos
        "points_earned", // Puntos ganados
        "points_redeemed", // Puntos canjeados
        "reward_claimed", // Recompensa reclamada
        "reward_used", // Recompensa utilizada
        "card_generated", // Tarjeta generada
        "card_updated", // Tarjeta actualizada
        "card_downloaded", // Tarjeta descargada
        "card_rotated", // QR rotado
      ],
    },
    scanMethod: {
      type: String,
      enum: ["qr", "barcode", "nfc", "manual", null],
      default: null,
    },
    pointsInvolved: {
      type: Number,
      default: 0,
    },
    balanceBefore: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: "points_reward",
      default: null,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    locationData: {
      branchId: {
        type: Schema.Types.ObjectId,
        ref: "cv_branch",
        required: [true, "La sucursal es requerida"],
      },
      terminalId: {
        type: String,
        default: null,
      },
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: "cs_user",
        default: null,
      },
      coordinates: {
        latitude: {
          type: Number,
          default: null,
        },
        longitude: {
          type: Number,
          default: null,
        },
      },
    },
    deviceInfo: {
      deviceId: {
        type: String,
        default: null,
      },
      deviceType: {
        type: String,
        enum: ["pos", "mobile", "tablet", "web", null],
        default: null,
      },
      appVersion: {
        type: String,
        default: null,
      },
      ipAddress: {
        type: String,
        default: null,
      },
      userAgent: {
        type: String,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
      maxlength: 500,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// Indexes para optimización
cardTransactionSchema.index({ digitalCardId: 1 });
cardTransactionSchema.index({ clientId: 1 });
cardTransactionSchema.index({ transactionType: 1 });
cardTransactionSchema.index({ "locationData.branchId": 1 });
cardTransactionSchema.index({ processedAt: -1 });
cardTransactionSchema.index({ status: 1 });
cardTransactionSchema.index({ createdAt: -1 });

// Compound indexes para búsquedas frecuentes
cardTransactionSchema.index({ clientId: 1, transactionType: 1 });
cardTransactionSchema.index({ digitalCardId: 1, transactionType: 1 });
cardTransactionSchema.index({ "locationData.branchId": 1, processedAt: -1 });

// Método para crear transacción de escaneo
cardTransactionSchema.statics.createScanTransaction = async function(data) {
  const transaction = new this({
    digitalCardId: data.digitalCardId,
    clientId: data.clientId,
    transactionType: "scan",
    scanMethod: data.scanMethod || "qr",
    balanceBefore: data.currentPoints || 0,
    balanceAfter: data.currentPoints || 0,
    locationData: {
      branchId: data.branchId,
      terminalId: data.terminalId,
      employeeId: data.employeeId,
      coordinates: data.coordinates,
    },
    deviceInfo: {
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      appVersion: data.appVersion,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
    status: "success",
  });

  return transaction.save();
};

// Método para crear transacción de puntos
cardTransactionSchema.statics.createPointsTransaction = async function(data) {
  const transaction = new this({
    digitalCardId: data.digitalCardId,
    clientId: data.clientId,
    transactionType: data.type, // points_earned o points_redeemed
    pointsInvolved: Math.abs(data.points),
    balanceBefore: data.balanceBefore,
    balanceAfter: data.balanceAfter,
    orderId: data.orderId,
    locationData: {
      branchId: data.branchId,
      terminalId: data.terminalId,
      employeeId: data.employeeId,
    },
    deviceInfo: data.deviceInfo,
    status: "success",
    notes: data.notes,
  });

  return transaction.save();
};

// Método para crear transacción de recompensa
cardTransactionSchema.statics.createRewardTransaction = async function(data) {
  const transaction = new this({
    digitalCardId: data.digitalCardId,
    clientId: data.clientId,
    transactionType: data.type, // reward_claimed o reward_used
    pointsInvolved: data.pointsUsed || 0,
    balanceBefore: data.balanceBefore,
    balanceAfter: data.balanceAfter,
    rewardId: data.rewardId,
    orderId: data.orderId,
    locationData: {
      branchId: data.branchId,
      employeeId: data.employeeId,
    },
    status: "success",
    notes: data.notes,
  });

  return transaction.save();
};

// Método para obtener historial de transacciones
cardTransactionSchema.statics.getHistory = async function(clientId, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    type = null, 
    branchId = null,
    startDate = null,
    endDate = null 
  } = options;

  const query = { clientId };
  
  if (type) query.transactionType = type;
  if (branchId) query["locationData.branchId"] = branchId;
  
  if (startDate || endDate) {
    query.processedAt = {};
    if (startDate) query.processedAt.$gte = new Date(startDate);
    if (endDate) query.processedAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate("rewardId")
    .populate("orderId")
    .populate("locationData.branchId")
    .populate("locationData.employeeId", "name")
    .sort({ processedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Método para obtener estadísticas
cardTransactionSchema.statics.getStatistics = async function(clientId, branchId = null) {
  const match = { clientId };
  if (branchId) match["locationData.branchId"] = branchId;

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$transactionType",
        count: { $sum: 1 },
        totalPoints: { $sum: "$pointsInvolved" },
      },
    },
    {
      $group: {
        _id: null,
        transactions: {
          $push: {
            type: "$_id",
            count: "$count",
            totalPoints: "$totalPoints",
          },
        },
        totalTransactions: { $sum: "$count" },
        totalPointsEarned: {
          $sum: {
            $cond: [
              { $eq: ["$_id", "points_earned"] },
              "$totalPoints",
              0,
            ],
          },
        },
        totalPointsRedeemed: {
          $sum: {
            $cond: [
              { $eq: ["$_id", "points_redeemed"] },
              "$totalPoints",
              0,
            ],
          },
        },
      },
    },
  ]);

  return stats[0] || {
    transactions: [],
    totalTransactions: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
  };
};

const CardTransaction = mongoose.model("card_transaction", cardTransactionSchema);
export { CardTransaction };