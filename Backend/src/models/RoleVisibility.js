import mongoose from "mongoose";
const { Schema } = mongoose;

const roleVisibilitySchema = new Schema({
  roleId: {
    type: Schema.Types.ObjectId,
    ref: "ac_role",
    required: true,
  },
  companies: [
    {
      type: Schema.Types.ObjectId,
      ref: "cc_companies",
    },
  ],
  brands: [
    {
      type: Schema.Types.ObjectId,
      ref: "cc_brand",
    },
  ],
  branches: [
    {
      type: Schema.Types.ObjectId,
      ref: "cc_branch",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

roleVisibilitySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

roleVisibilitySchema.methods.hasAccessToCompany = function (companyId) {
  return (
    this.companies.length === 0 ||
    this.companies.some((id) => id.equals(companyId))
  );
};

roleVisibilitySchema.methods.hasAccessToBrand = function (brandId) {
  return (
    this.brands.length === 0 || this.brands.some((id) => id.equals(brandId))
  );
};

roleVisibilitySchema.methods.hasAccessToBranch = function (branchId) {
  return (
    this.branches.length === 0 ||
    this.branches.some((id) => id.equals(branchId))
  );
};

roleVisibilitySchema.methods.getHierarchicalStructure = async function () {
  try {
    const { Company } = await import("./Company.js");
    const { Brand } = await import("./Brand.js");
    const { RsCompanyBrand } = await import("./CompanyBrands.js");
    const { Branch } = await import("./Branch.js");

    const structure = {
      hasFullAccess: this.companies.length === 0,
      companies: {},
    };

    let companies;
    if (this.companies.length === 0) {
      companies = await Company.find({ isActive: true });
    } else {
      companies = await Company.find({
        _id: { $in: this.companies },
        isActive: true,
      });
    }

    for (const company of companies) {
      structure.companies[company._id] = {
        name: company.name,
        brands: {},
      };

      const companyBrands = await RsCompanyBrand.getBrandsByCompany(
        company._id
      );

      for (const relation of companyBrands) {
        const brand = relation.brandId;
        if (!brand || !brand._id) continue;

        if (
          this.brands.length === 0 ||
          this.brands.some((b) => b.equals(brand._id))
        ) {
          structure.companies[company._id].brands[brand._id] = {
            name: brand.name,
            branches: {},
          };

          const branches = await Branch.find({
            companyId: company._id,
            brandId: brand._id,
            isActive: true,
          });

          for (const branch of branches) {
            if (
              this.branches.length === 0 ||
              this.branches.some((b) => b.equals(branch._id))
            ) {
              structure.companies[company._id].brands[brand._id].branches[
                branch._id
              ] = {
                name: branch.name,
              };
            }
          }
        }
      }
    }

    return structure;
  } catch (error) {
    console.error("Error en getHierarchicalStructure:", error);
    throw error;
  }
};

const RoleVisibility = mongoose.model(
  "ac_role_visibility",
  roleVisibilitySchema
);

export { RoleVisibility };
