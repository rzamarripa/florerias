import mongoose from "mongoose";
const { Schema } = mongoose;

const departmentSchema = new Schema({
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "cc_brand",
    required: true,
  },
  name: {
    type: String,
    required: true,
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
});

departmentSchema.index({ name: 1, brandId: 1 }, { unique: true });

departmentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Department = mongoose.model("cc_department", departmentSchema);

export { Department };
