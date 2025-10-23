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

const storageSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
      unique: true, // Una sucursal solo puede tener un almacén
    },
    warehouseManager: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El gerente de almacén es requerido"],
    },
    products: {
      type: [productItemSchema],
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
        required: [true, "La calle es requerida"],
        trim: true,
      },
      externalNumber: {
        type: String,
        required: [true, "El número exterior es requerido"],
        trim: true,
      },
      internalNumber: {
        type: String,
        trim: true,
        default: "",
      },
      neighborhood: {
        type: String,
        required: [true, "La colonia es requerida"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "La ciudad es requerida"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "El estado es requerido"],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, "El código postal es requerido"],
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

const Storage = mongoose.model("cv_storage", storageSchema);
export { Storage };
