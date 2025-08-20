import mongoose from "mongoose";
const { Schema } = mongoose;

const invoicesPackageCompanySchema = new Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cc_invoices_package",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cc_companies",
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cc_brand",
      required: false,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cc_branch",
      required: false,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cc_route",
      required: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "rs_invoices_packages_companies",
  }
);

invoicesPackageCompanySchema.index({ packageId: 1, companyId: 1 });
invoicesPackageCompanySchema.index({ companyId: 1, brandId: 1 });
invoicesPackageCompanySchema.index({ brandId: 1, branchId: 1 });
invoicesPackageCompanySchema.index({ branchId: 1, routeId: 1 });

invoicesPackageCompanySchema.statics.findByPackageId = function (packageId) {
  return this.findOne({ packageId }).populate([
    "companyId",
    "brandId",
    "branchId",
    "routeId",
  ]);
};

invoicesPackageCompanySchema.statics.findByCompanyId = function (companyId) {
  return this.find({ companyId }).populate([
    "packageId",
    "brandId",
    "branchId",
  ]);
};

invoicesPackageCompanySchema.statics.findByBrandId = function (brandId) {
  return this.find({ brandId }).populate([
    "packageId",
    "companyId",
    "branchId",
  ]);
};

invoicesPackageCompanySchema.statics.findByBranchId = function (branchId) {
  return this.find({ branchId }).populate([
    "packageId",
    "companyId",
    "brandId",
    "routeId",
  ]);
};

invoicesPackageCompanySchema.statics.findByRouteId = function (routeId) {
  return this.find({ routeId }).populate([
    "packageId",
    "companyId",
    "brandId",
    "branchId",
  ]);
};

const InvoicesPackageCompany = mongoose.model(
  "rs_invoices_packages_companies",
  invoicesPackageCompanySchema
);

export { InvoicesPackageCompany };
