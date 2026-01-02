import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * LuyoaSyncQueue - Cola de sincronización con Luyoa
 *
 * Almacena las operaciones pendientes de sincronizar con Luyoa,
 * con soporte para reintentos y manejo de errores.
 */
const luyoaSyncQueueSchema = new Schema(
  {
    // Tipo de operación a sincronizar
    operation: {
      type: String,
      enum: [
        "points_update",      // Actualizar puntos
        "card_register",      // Registrar nueva tarjeta
        "card_deactivate",    // Desactivar tarjeta
        "reward_redeem",      // Canjear recompensa
        "tier_update",        // Actualizar nivel/tier
        "profile_update",     // Actualizar perfil del cliente
      ],
      required: true,
      index: true,
    },

    // Estado del job
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    // Prioridad (mayor = más urgente)
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
      index: true,
    },

    // Referencias
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: true,
      index: true,
    },

    luyoaCardId: {
      type: Schema.Types.ObjectId,
      ref: "luyoa_card",
      index: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      index: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "cc_orders",
      index: true,
    },

    // Payload de la operación (datos a enviar a Luyoa)
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },

    // Resultado de Luyoa
    response: {
      type: Schema.Types.Mixed,
      default: null,
    },

    // Información de reintentos
    retryCount: {
      type: Number,
      default: 0,
    },

    maxRetries: {
      type: Number,
      default: 5,
    },

    // Próximo intento programado
    nextRetryAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Último error
    lastError: {
      message: String,
      code: String,
      stack: String,
      occurredAt: Date,
    },

    // Historial de errores
    errorHistory: [{
      message: String,
      code: String,
      attemptNumber: Number,
      occurredAt: { type: Date, default: Date.now },
    }],

    // Timestamps de procesamiento
    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ID del worker que está procesando (para evitar duplicados)
    lockedBy: {
      type: String,
      default: null,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    // Expiración del lock (para recuperar jobs abandonados)
    lockExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para el procesamiento de la cola
luyoaSyncQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
luyoaSyncQueueSchema.index({ status: 1, nextRetryAt: 1 });
luyoaSyncQueueSchema.index({ lockedBy: 1, lockExpiresAt: 1 });

// Método para calcular el próximo reintento con backoff exponencial
luyoaSyncQueueSchema.methods.calculateNextRetry = function() {
  // Backoff exponencial: 1min, 2min, 4min, 8min, 16min...
  const baseDelay = 60 * 1000; // 1 minuto
  const delay = baseDelay * Math.pow(2, this.retryCount);
  const maxDelay = 30 * 60 * 1000; // Máximo 30 minutos
  return new Date(Date.now() + Math.min(delay, maxDelay));
};

// Método para marcar como fallido y programar reintento
luyoaSyncQueueSchema.methods.markFailed = async function(error) {
  this.retryCount += 1;
  this.lastError = {
    message: error.message,
    code: error.code || "UNKNOWN",
    stack: error.stack,
    occurredAt: new Date(),
  };

  this.errorHistory.push({
    message: error.message,
    code: error.code || "UNKNOWN",
    attemptNumber: this.retryCount,
  });

  // Liberar lock
  this.lockedBy = null;
  this.lockedAt = null;
  this.lockExpiresAt = null;

  if (this.retryCount >= this.maxRetries) {
    this.status = "failed";
    this.completedAt = new Date();
  } else {
    this.status = "pending";
    this.nextRetryAt = this.calculateNextRetry();
  }

  return this.save();
};

// Método para marcar como completado
luyoaSyncQueueSchema.methods.markCompleted = async function(response) {
  this.status = "completed";
  this.response = response;
  this.completedAt = new Date();
  this.lockedBy = null;
  this.lockedAt = null;
  this.lockExpiresAt = null;
  return this.save();
};

// Método estático para obtener el próximo job a procesar
luyoaSyncQueueSchema.statics.getNextJob = async function(workerId) {
  const lockDuration = 5 * 60 * 1000; // 5 minutos de lock
  const now = new Date();

  // Buscar jobs pendientes o con retry programado
  const job = await this.findOneAndUpdate(
    {
      $or: [
        // Jobs pendientes sin lock
        {
          status: "pending",
          $or: [
            { nextRetryAt: null },
            { nextRetryAt: { $lte: now } },
          ],
          $or: [
            { lockedBy: null },
            { lockExpiresAt: { $lt: now } }, // Lock expirado
          ],
        },
      ],
    },
    {
      $set: {
        status: "processing",
        lockedBy: workerId,
        lockedAt: now,
        lockExpiresAt: new Date(now.getTime() + lockDuration),
        startedAt: now,
      },
    },
    {
      new: true,
      sort: { priority: -1, createdAt: 1 },
    }
  );

  return job;
};

// Método estático para crear un nuevo job
luyoaSyncQueueSchema.statics.enqueue = async function(data) {
  const job = new this({
    operation: data.operation,
    clientId: data.clientId,
    luyoaCardId: data.luyoaCardId,
    branchId: data.branchId,
    orderId: data.orderId,
    payload: data.payload,
    priority: data.priority || 5,
    maxRetries: data.maxRetries || 5,
  });

  return job.save();
};

// Método estático para obtener estadísticas de la cola
luyoaSyncQueueSchema.statics.getQueueStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  });
};

const LuyoaSyncQueue = mongoose.model("luyoa_sync_queue", luyoaSyncQueueSchema);
export default LuyoaSyncQueue;
