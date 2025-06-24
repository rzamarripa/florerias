import mongoose from "mongoose";
const { Schema } = mongoose;

const rsBranchBrandSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: "cc_branch",
    required: true,
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "cc_brand",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

rsBranchBrandSchema.index({ branchId: 1, brandId: 1 }, { unique: true });

rsBranchBrandSchema.statics.getBranchesByBrand = async function (brandId) {
  return this.find({ brandId }).populate("branchId");
};

rsBranchBrandSchema.statics.getBrandsByBranch = async function (branchId) {
  return this.find({ branchId }).populate("brandId");
};

rsBranchBrandSchema.statics.createRelation = async function (
  branchId,
  brandId
) {
  return this.create({ branchId, brandId });
};

rsBranchBrandSchema.statics.removeRelation = async function (
  branchId,
  brandId
) {
  return this.deleteOne({ branchId, brandId });
};

const RsBranchBrand = mongoose.model("rs_branch_brand", rsBranchBrandSchema);

export { RsBranchBrand }; 