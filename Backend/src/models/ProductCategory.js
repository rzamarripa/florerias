import mongoose from "mongoose";
const { Schema } = mongoose;

const productCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
productCategorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
productCategorySchema.index({ name: 1 });
productCategorySchema.index({ isActive: 1 });
productCategorySchema.index({ createdAt: -1 });

const ProductCategory = mongoose.model("cv_product_category", productCategorySchema);
export { ProductCategory };
