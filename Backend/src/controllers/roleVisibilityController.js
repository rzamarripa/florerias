import { RsBranchBrand } from "../models/BranchBrands.js";
import { Company } from "../models/Company.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";
import { RoleVisibility } from "../models/RoleVisibility.js";
import { User } from "../models/User.js";

export const getAllStructure = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).lean();
    const companyBrands = await RsCompanyBrand.find()
      .populate("brandId")
      .lean();
    const branchBrands = await RsBranchBrand.find().populate("branchId").lean();

    const companyMap = new Map();
    const brandMap = new Map();

    companies.forEach((company) => {
      companyMap.set(company._id.toString(), {
        name: company.name,
        brands: {},
      });
    });

    companyBrands.forEach((relation) => {
      const companyId = relation.companyId.toString();
      const brand = relation.brandId;

      if (!brand || !companyMap.has(companyId)) return;

      const brandId = brand._id.toString();
      brandMap.set(brandId, brand);

      if (!companyMap.get(companyId).brands[brandId]) {
        companyMap.get(companyId).brands[brandId] = {
          name: brand.name,
          branches: {},
        };
      }
    });

    branchBrands.forEach((relation) => {
      const brandId = relation.brandId.toString();
      const branch = relation.branchId;

      if (!branch || !branch.isActive) return;

      const branchId = branch._id.toString();
      const companyId = branch.companyId.toString();

      if (!companyMap.has(companyId)) return;

      const company = companyMap.get(companyId);
      if (company.brands[brandId]) {
        company.brands[brandId].branches[branchId] = {
          name: branch.name,
        };
      }
    });

    const structure = {
      companies: Object.fromEntries(companyMap),
    };

    res.json({
      success: true,
      data: structure,
    });
  } catch (error) {
    console.error("Error al obtener estructura completa:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la estructura jerárquica",
      error: error.message,
    });
  }
};

export const getUserVisibilityStructure = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const visibility = await RoleVisibility.findOne({ userId });

    res.json({
      success: true,
      data: {
        companies: {},
        selectedCompanies: visibility
          ? visibility.companies.map((id) => id.toString())
          : [],
        selectedBrands: visibility
          ? visibility.brands.map((b) => b.brandId.toString())
          : [],
        selectedBranches: visibility
          ? visibility.branches.map((b) => b.branchId.toString())
          : [],
        brands: visibility
          ? visibility.brands.map((b) => ({
              companyId: b.companyId.toString(),
              brandId: b.brandId.toString(),
            }))
          : [],
        branches: visibility
          ? visibility.branches.map((b) => ({
              companyId: b.companyId.toString(),
              brandId: b.brandId.toString(),
              branchId: b.branchId.toString(),
            }))
          : [],
      },
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

export const updateUserVisibility = async (req, res) => {
  try {
    const { userId } = req.params;
    let { companies, brands, branches } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Normalizar brands y branches para que sean arrays de objetos
    if (brands && brands.length > 0 && typeof brands[0] === "string") {
      // Compatibilidad: si viene como array de brandId, convertir a objetos sin companyId
      brands = brands.map((brandId) => ({ brandId }));
    }
    if (branches && branches.length > 0 && typeof branches[0] === "string") {
      branches = branches.map((branchId) => ({ branchId }));
    }

    const visibility = await RoleVisibility.findOneAndUpdate(
      { userId },
      {
        companies: companies || [],
        brands: brands || [],
        branches: branches || [],
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: visibility,
    });
  } catch (error) {
    console.error("Error al actualizar visibilidad:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la visibilidad",
      error: error.message,
    });
  }
};

export const checkAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId, brandId, branchId } = req.query;

    const visibility = await RoleVisibility.findOne({ userId });
    if (!visibility) {
      return res.json({
        success: true,
        data: { hasAccess: true },
      });
    }

    let hasAccess = true;

    if (companyId) {
      hasAccess = hasAccess && visibility.hasAccessToCompany(companyId);
    }
    if (brandId) {
      hasAccess = hasAccess && visibility.hasAccessToBrand(brandId);
    }
    if (branchId) {
      hasAccess = hasAccess && visibility.hasAccessToBranch(branchId);
    }

    res.json({
      success: true,
      data: { hasAccess },
    });
  } catch (error) {
    console.error("Error al verificar acceso:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar el acceso",
      error: error.message,
    });
  }
};

export const getUserVisibilityForSelects = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const visibility = await RoleVisibility.findOne({ userId });

    if (!visibility) {
      return res.json({
        success: true,
        data: {
          companies: [],
          brands: [],
          branches: [],
          hasFullAccess: true,
        },
      });
    }

    const structure = await visibility.getHierarchicalStructure();

    const companyIds = Object.keys(structure.companies);
    const companiesData = await Company.find({
      _id: { $in: companyIds },
      isActive: true,
    });

    const companies = companiesData.map((company) => ({
      _id: company._id.toString(),
      name: company.name,
      rfc: company.rfc,
      legalRepresentative: company.legalRepresentative,
      address: company.address,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
    }));

    const brands = [];
    const branches = [];

    Object.entries(structure.companies).forEach(([companyId, company]) => {
      Object.entries(company.brands).forEach(([brandId, brandData]) => {
        brands.push({
          _id: brandId,
          name: brandData.name,
          companyId: companyId,
        });

        Object.entries(brandData.branches).forEach(([branchId, branchData]) => {
          branches.push({
            _id: branchId,
            name: branchData.name,
            brandId: brandId,
            companyId: companyId,
          });
        });
      });
    });

    res.json({
      success: true,
      data: {
        companies,
        brands,
        branches,
        hasFullAccess: structure.hasFullAccess,
      },
    });
  } catch (error) {
    console.error("Error en getUserVisibilityForSelects:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

export const testBranchBrandRelations = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: "Se requiere brandId",
      });
    }

    const branchBrandRelations = await RsBranchBrand.find({
      brandId: brandId,
    }).populate("branchId");

    const branches = branchBrandRelations
      .filter((relation) => relation.branchId && relation.branchId._id)
      .map((relation) => ({
        branchId: relation.branchId._id,
        branchName: relation.branchId.name,
        companyId: relation.branchId.companyId,
        brandId: relation.brandId,
      }));

    res.json({
      success: true,
      data: {
        brandId,
        totalRelations: branchBrandRelations.length,
        branches,
      },
    });
  } catch (error) {
    console.error("Error en testBranchBrandRelations:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};
