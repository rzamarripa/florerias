import mongoose from "mongoose";
const { Schema } = mongoose;

const rsCompanyBrandSchema = new Schema({
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "cc_brand",
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "cc_company",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

rsCompanyBrandSchema.index({ brandId: 1, companyId: 1 }, { unique: true });

rsCompanyBrandSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
  }
};

rsCompanyBrandSchema.statics.getBrandsByCompany = async function (companyId) {
  return this.find({ companyId }).populate("brandId");
};

rsCompanyBrandSchema.statics.getCompaniesByBrand = async function (brandId) {
  return this.find({ brandId }).populate("companyId");
};

rsCompanyBrandSchema.statics.createRelation = async function (
  brandId,
  companyId
) {
  return this.create({ brandId, companyId });
};

rsCompanyBrandSchema.statics.removeRelation = async function (
  brandId,
  companyId
) {
  return this.deleteOne({ brandId, companyId });
};

const RsCompanyBrand = mongoose.model("rs_company_brand", rsCompanyBrandSchema);

export { RsCompanyBrand };
