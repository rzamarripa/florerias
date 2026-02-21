import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "El ID de la orden es requerido"],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: [true, "El ID del cliente es requerido"],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "El ID del producto es requerido"],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "El ID de la sucursal es requerido"],
    },
    rating: {
      type: Number,
      required: [true, "La calificación es requerida"],
      min: [1, "La calificación mínima es 1"],
      max: [5, "La calificación máxima es 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "El comentario no puede exceder 500 caracteres"],
      default: "",
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// Unique compound index: one review per client per product per order
reviewSchema.index({ orderId: 1, productId: 1, clientId: 1 }, { unique: true });
reviewSchema.index({ clientId: 1 });
reviewSchema.index({ productId: 1 });

const Review = mongoose.model("review", reviewSchema);
export { Review };
