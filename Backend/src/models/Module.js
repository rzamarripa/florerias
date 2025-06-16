import mongoose from "mongoose";
const { Schema } = mongoose;

const moduleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Module name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    page: {
      type: Schema.Types.ObjectId,
      ref: "ac_pages", // ✅ CAMBIO: Era "Page", ahora "ac_pages"
      required: [true, "Page reference is required"],
    },
    status: {
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
    strictPopulate: false,
  }
);

moduleSchema.index({ name: 1, page: 1 }, { unique: true });

moduleSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

moduleSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

moduleSchema.methods.getPublicInfo = function () {
  return {
    _id: this._id, // ✅ CAMBIO: Era *id, ahora _id (corrección de sintaxis)
    name: this.name,
    description: this.description,
    page: this.page,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Module = mongoose.model("ac_modules", moduleSchema);
export { Module };