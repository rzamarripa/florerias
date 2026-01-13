import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
const { Schema } = mongoose;

const digitalCardSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: [true, "El cliente es requerido"],
      unique: true,
    },
    passSerialNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    passTypeId: {
      type: String,
      default: null, // Apple Pass Type ID
    },
    googleWalletId: {
      type: String,
      default: null,
    },
    qrCode: {
      type: String,
      required: true, // Base64 encoded QR image
    },
    qrData: {
      type: String,
      required: true, // Encrypted data for QR
    },
    barcode: {
      type: String,
      default: null, // Barcode number
    },
    cardType: {
      type: String,
      enum: ["apple", "google", "generic"],
      default: "generic",
    },
    lastPointsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    pushToken: {
      apple: {
        type: String,
        default: null,
      },
      google: {
        type: String,
        default: null,
      },
    },
    passUrl: {
      apple: {
        type: String,
        default: null,
      },
      google: {
        type: String,
        default: null,
      },
    },
    downloads: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Expira en 1 año
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      },
    },
    metadata: {
      backgroundColor: {
        type: String,
        default: "#8B5CF6", // Purple
      },
      foregroundColor: {
        type: String,
        default: "#FFFFFF",
      },
      labelColor: {
        type: String,
        default: "#FFFFFF",
      },
      logoText: {
        type: String,
        default: "Corazón Violeta",
      },
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
    },
    rotationSchedule: {
      enabled: {
        type: Boolean,
        default: true,
      },
      intervalDays: {
        type: Number,
        default: 30, // Rotar código QR cada 30 días
      },
      lastRotation: {
        type: Date,
        default: Date.now,
      },
      nextRotation: {
        type: Date,
        default: function() {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date;
        },
      },
    },
    devices: [{
      deviceId: {
        type: String,
        required: true,
      },
      deviceType: {
        type: String,
        enum: ["ios", "android", "web"],
        required: true,
      },
      registeredAt: {
        type: Date,
        default: Date.now,
      },
      lastAccess: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// Indexes
digitalCardSchema.index({ clientId: 1 });
digitalCardSchema.index({ passSerialNumber: 1 });
digitalCardSchema.index({ branchId: 1 });
digitalCardSchema.index({ isActive: 1 });
digitalCardSchema.index({ expiresAt: 1 });
digitalCardSchema.index({ "rotationSchedule.nextRotation": 1 });

// Métodos
digitalCardSchema.methods.needsRotation = function() {
  if (!this.rotationSchedule.enabled) return false;
  return new Date() >= this.rotationSchedule.nextRotation;
};

digitalCardSchema.methods.rotate = async function(newQrCode, newQrData) {
  this.qrCode = newQrCode;
  this.qrData = newQrData;
  this.rotationSchedule.lastRotation = new Date();
  this.rotationSchedule.nextRotation = new Date(
    Date.now() + this.rotationSchedule.intervalDays * 24 * 60 * 60 * 1000
  );
  return this.save();
};

digitalCardSchema.methods.updateBalance = function(newBalance) {
  this.lastPointsBalance = newBalance;
  this.lastUpdated = new Date();
  return this.save();
};

digitalCardSchema.methods.recordDownload = function() {
  this.downloads += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

digitalCardSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

digitalCardSchema.methods.addDevice = function(deviceId, deviceType) {
  const existingDevice = this.devices.find(d => d.deviceId === deviceId);
  
  if (existingDevice) {
    existingDevice.lastAccess = new Date();
  } else {
    this.devices.push({
      deviceId,
      deviceType,
      registeredAt: new Date(),
      lastAccess: new Date(),
    });
  }
  
  return this.save();
};

const DigitalCard = mongoose.model("digital_card", digitalCardSchema);
export { DigitalCard };