import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * LuyoaCard - Mapea clientes locales con tarjetas de Luyoa Wallet
 *
 * Esta tabla actúa como puente entre tu sistema de puntos y Luyoa,
 * almacenando la información necesaria para sincronizar puntos.
 */
const luyoaCardSchema = new Schema(
  {
    // Referencia al cliente local
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: true,
      index: true,
    },

    // ID de la tarjeta en Luyoa (proporcionado por su API)
    luyoaCardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ID del pass en el wallet (Apple/Google)
    luyoaPassId: {
      type: String,
      default: null,
    },

    // Sucursal donde se registró la tarjeta
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: true,
      index: true,
    },

    // Estado de la tarjeta
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "expired"],
      default: "active",
      index: true,
    },

    // Última sincronización exitosa con Luyoa
    lastSyncAt: {
      type: Date,
      default: null,
    },

    // Puntos sincronizados con Luyoa (puede diferir temporalmente de client.points)
    syncedPoints: {
      type: Number,
      default: 0,
    },

    // Tier/nivel en Luyoa (si aplica)
    luyoaTier: {
      type: String,
      default: null,
    },

    // Metadata adicional de Luyoa
    luyoaMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // QR code asociado (para escaneo en POS)
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Fecha de registro en Luyoa
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas frecuentes
luyoaCardSchema.index({ clientId: 1, branchId: 1 });
luyoaCardSchema.index({ status: 1, lastSyncAt: 1 });

// Método para verificar si necesita sincronización
luyoaCardSchema.methods.needsSync = function(currentPoints) {
  return this.syncedPoints !== currentPoints;
};

// Método para marcar como sincronizado
luyoaCardSchema.methods.markSynced = function(points) {
  this.syncedPoints = points;
  this.lastSyncAt = new Date();
  return this.save();
};

// Método estático para encontrar por QR
luyoaCardSchema.statics.findByQR = function(qrCode) {
  return this.findOne({ qrCode, status: "active" }).populate("clientId");
};

// Método estático para encontrar por cliente
luyoaCardSchema.statics.findByClient = function(clientId, branchId) {
  const query = { clientId, status: "active" };
  if (branchId) query.branchId = branchId;
  return this.findOne(query);
};

const LuyoaCard = mongoose.model("luyoa_card", luyoaCardSchema);
export default LuyoaCard;
