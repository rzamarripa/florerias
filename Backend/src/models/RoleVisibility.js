import mongoose from "mongoose";
const { Schema } = mongoose;

const roleVisibilitySchema = new Schema({
  roleId: {
    type: Schema.Types.ObjectId,
    ref: "ac_role",
    required: true,
  },
  // Si companies, brands y branches están vacíos, significa acceso total
  companies: [
    {
      type: Schema.Types.ObjectId,
      ref: "cc_company",
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

// Si el array está vacío, significa acceso total a ese nivel
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

// Método para obtener la estructura jerárquica de permisos
roleVisibilitySchema.methods.getHierarchicalStructure = async function () {
  try {
    // Importar modelos
    const { Company } = await import("./Company.js");
    const { Brand } = await import("./Brand.js");
    const { RsCompanyBrand } = await import("./CompanyBrands.js");
    const { Branch } = await import("./Branch.js");

    // Estructura base
    const structure = {
      hasFullAccess: this.companies.length === 0,
      companies: {},
    };

    // Obtener compañías
    let companies;
    if (this.companies.length === 0) {
      // Acceso total, obtener todas las compañías activas
      companies = await Company.find({ isActive: true });
    } else {
      // Acceso limitado a compañías específicas
      companies = await Company.find({
        _id: { $in: this.companies },
        isActive: true,
      });
    }

    // Procesar compañías
    for (const company of companies) {
      structure.companies[company._id] = {
        name: company.name,
        brands: {},
      };

      // Obtener marcas de la compañía
      const companyBrands = await RsCompanyBrand.getBrandsByCompany(
        company._id
      );

      for (const relation of companyBrands) {
        const brand = relation.brandId;
        if (!brand || !brand._id) continue; // Skip si la marca no existe

        if (
          this.brands.length === 0 ||
          this.brands.some((b) => b.equals(brand._id))
        ) {
          structure.companies[company._id].brands[brand._id] = {
            name: brand.name,
            branches: {},
          };

          // Obtener sucursales de la marca en esta compañía
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
