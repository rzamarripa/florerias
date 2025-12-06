import mongoose from "mongoose";
const { Schema } = mongoose;

const productItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "El ID del producto es requerido"],
    },
    quantity: {
      type: Number,
      required: [true, "La cantidad es requerida"],
      min: [0, "La cantidad no puede ser negativa"],
      default: 0,
    },
  },
  { _id: true }
);

const materialItemSchema = new Schema(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "El ID del material es requerido"],
    },
    quantity: {
      type: Number,
      required: [true, "La cantidad es requerida"],
      min: [0, "La cantidad no puede ser negativa"],
      default: 0,
    },
  },
  { _id: true }
);

const storageSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
      unique: true, // Una sucursal solo puede tener un almacén
    },
    name: {
      type: String,
      required: [true, "El nombre del almacén es requerido"],
      trim: true,
    },
    warehouseManager: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: false,
    },
    products: {
      type: [productItemSchema],
      default: [],
    },
    materials: {
      type: [materialItemSchema],
      default: [],
    },
    lastIncome: {
      type: Date,
      default: null,
    },
    lastOutcome: {
      type: Date,
      default: null,
    },
    address: {
      street: {
        type: String,
        required: false,
        trim: true,
      },
      externalNumber: {
        type: String,
        required: false,
        trim: true,
      },
      internalNumber: {
        type: String,
        trim: true,
        default: "",
      },
      neighborhood: {
        type: String,
        required: false,
        trim: true,
      },
      city: {
        type: String,
        required: false,
        trim: true,
      },
      state: {
        type: String,
        required: false,
        trim: true,
      },
      postalCode: {
        type: String,
        required: false,
        trim: true,
        match: [/^\d{5}$/, "El código postal debe tener 5 dígitos"],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para actualizar updatedAt
storageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
storageSchema.index({ branch: 1 });
storageSchema.index({ warehouseManager: 1 });
storageSchema.index({ isActive: 1 });
storageSchema.index({ "products.productId": 1 });
storageSchema.index({ "materials.materialId": 1 });

const Storage = mongoose.model("cv_storage", storageSchema);
export { Storage };
