import mongoose from "mongoose";
const { Schema } = mongoose;

const routeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "cc_category",
    required: true,
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "cc_brand",
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "cc_companies",
    required: true,
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: "cc_branch",
    required: true,
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

routeSchema.index({ name: 1, categoryId: 1, brandId: 1, companyId: 1, branchId: 1 }, { unique: true });

routeSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const { Brand } = await import("./Brand.js");
    const { Branch } = await import("./Branch.js");
    const { Category } = await import("./Category.js");
    const { RsBranchBrand } = await import("./BranchBrands.js");

    const branchBrandRelations = await RsBranchBrand.find()
      .populate("brandId")
      .populate("branchId");

    const categories = await Category.find({ hasRoutes: true });
    
    if (categories.length === 0) {
      console.log("No categories with hasRoutes=true found for seeding routes");
      return;
    }

    const seedData = [];
    branchBrandRelations.forEach((relation, index) => {
      if (relation.brandId && relation.branchId) {
        const category = categories[index % categories.length];
        seedData.push({
          name: `Route ${index + 1}`,
          categoryId: category._id,
          brandId: relation.brandId._id,
          companyId: relation.branchId.companyId,
          branchId: relation.branchId._id,
          description: `Route for ${relation.brandId.name} at ${relation.branchId.name}`,
          status: true,
        });
      }
    });

    if (seedData.length > 0) {
      await this.create(seedData);
    }
  }
};

routeSchema.statics.getRoutesByBranch = async function (branchId) {
  return this.find({ branchId }).populate("categoryId").populate("brandId").populate("companyId");
};

routeSchema.statics.getRoutesByBrand = async function (brandId) {
  return this.find({ brandId }).populate("categoryId").populate("branchId").populate("companyId");
};

routeSchema.statics.getRoutesByCompany = async function (companyId) {
  return this.find({ companyId }).populate("categoryId").populate("brandId").populate("branchId");
};

routeSchema.statics.getRoutesByCategory = async function (categoryId) {
  return this.find({ categoryId }).populate("brandId").populate("companyId").populate("branchId");
};

const Route = mongoose.model("cc_route", routeSchema);

export { Route };
