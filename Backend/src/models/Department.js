import mongoose from "mongoose";
const { Schema } = mongoose;

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

// Indexes for search optimization
departmentSchema.index({ isActive: 1 });

const Department = mongoose.model("cc_department", departmentSchema);
export { Department };