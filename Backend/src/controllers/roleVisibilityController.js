import { RoleVisibility } from "../models/RoleVisibility.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
import { Brand } from "../models/Brand.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";
import { Branch } from "../models/Branch.js";
import { RsBranchBrand } from "../models/BranchBrands.js";

// Obtener la estructura jerárquica completa sin filtrar por usuario
export const getAllStructure = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true });

    const companyBrands = await RsCompanyBrand.find().populate('brandId');

    const branches = await Branch.find({ isActive: true });

    const companyMap = new Map();
    const brandMap = new Map();

    companies.forEach(company => {
      companyMap.set(company._id.toString(), {
        name: company.name,
        brands: {}
      });
    });

    companyBrands.forEach(relation => {
      const companyId = relation.companyId.toString();
      const brand = relation.brandId;

      if (!brand || !companyMap.has(companyId)) return;

      const brandId = brand._id.toString();
      brandMap.set(brandId, brand);

      if (!companyMap.get(companyId).brands[brandId]) {
        companyMap.get(companyId).brands[brandId] = {
          name: brand.name,
          branches: {}
        };
      }
    });

    branches.forEach(branch => {
      const companyId = branch.companyId.toString();
      const brandId = branch.brandId?.toString();

      if (!companyMap.has(companyId) || !brandId) return;

      const company = companyMap.get(companyId);
      if (company.brands[brandId]) {
        company.brands[brandId].branches[branch._id.toString()] = {
          name: branch.name
        };
      }
    });

    const structure = {
      companies: Object.fromEntries(companyMap)
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

// Obtener la estructura jerárquica de visibilidad para un usuario
export const getUserVisibilityStructure = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Obtener o crear la configuración de visibilidad
    let visibility = await RoleVisibility.findOne({ userId });
    if (!visibility) {
      // Si no existe, crear una con acceso total (arrays vacíos)
      try {
        visibility = await RoleVisibility.create({ userId });
      } catch (error) {
        console.error("Error al crear visibilidad:", error);
        return res.status(500).json({
          success: false,
          message: "Error al crear la configuración de visibilidad",
          error: error.message,
        });
      }
    }

    // Obtener la estructura jerárquica
    try {
      const structure = await visibility.getHierarchicalStructure();
      res.json({
        success: true,
        data: structure,
      });
    } catch (error) {
      console.error("Error al obtener estructura:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la estructura jerárquica",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar la visibilidad de un usuario
export const updateUserVisibility = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companies, brands, branches } = req.body;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Procesar las marcas para obtener automáticamente las sucursales relacionadas
    let processedBranches = branches || [];

    if (brands && brands.length > 0) {
      try {
        // Obtener todas las relaciones marca-sucursal para las marcas seleccionadas
        const branchBrandRelations = await RsBranchBrand.find({
          brandId: { $in: brands }
        }).populate('branchId');

        // Extraer los IDs de las sucursales relacionadas
        const relatedBranchIds = branchBrandRelations
          .filter(relation => relation.branchId && relation.branchId._id)
          .map(relation => relation.branchId._id);

        // Combinar las sucursales explícitamente seleccionadas con las relacionadas a las marcas
        const allBranchIds = [...new Set([...processedBranches, ...relatedBranchIds])];
        processedBranches = allBranchIds;

        console.log('Marcas seleccionadas:', brands);
        console.log('Sucursales relacionadas encontradas:', relatedBranchIds);
        console.log('Sucursales finales (explícitas + relacionadas):', processedBranches);
      } catch (error) {
        console.error('Error al obtener sucursales relacionadas:', error);
        // Continuar con las sucursales explícitamente seleccionadas si hay error
      }
    }

    // Actualizar o crear la configuración de visibilidad
    const visibility = await RoleVisibility.findOneAndUpdate(
      { userId },
      {
        companies: companies || [],
        brands: brands || [],
        branches: processedBranches,
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

// Verificar acceso a una entidad específica
export const checkAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId, brandId, branchId } = req.query;

    const visibility = await RoleVisibility.findOne({ userId });
    if (!visibility) {
      // Si no hay configuración, asumir acceso total
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

// Obtener la estructura de visibilidad del usuario para selects en cascada
export const getUserVisibilityForSelects = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Obtener o crear la configuración de visibilidad
    let visibility = await RoleVisibility.findOne({ userId });
    if (!visibility) {
      // Si no existe, crear una con acceso total (arrays vacíos)
      visibility = await RoleVisibility.create({ userId });
    }

    // Obtener la estructura jerárquica
    const structure = await visibility.getHierarchicalStructure();

    // Obtener los datos completos de las compañías usando los IDs de la estructura
    const companyIds = Object.keys(structure.companies);
    const companiesData = await Company.find({
      _id: { $in: companyIds },
      isActive: true
    });

    // Convertir a formato para selects
    const companies = companiesData.map(company => ({
      _id: company._id.toString(),
      name: company.name,
      rfc: company.rfc,
      legalRepresentative: company.legalRepresentative,
      address: company.address,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString()
    }));

    const brands = [];
    const branches = [];

    // Extraer marcas y sucursales de la estructura
    Object.entries(structure.companies).forEach(([companyId, company]) => {
      Object.entries(company.brands).forEach(([brandId, brandData]) => {
        brands.push({
          _id: brandId,
          name: brandData.name,
          companyId: companyId
        });

        Object.entries(brandData.branches).forEach(([branchId, branchData]) => {
          branches.push({
            _id: branchId,
            name: branchData.name,
            brandId: brandId,
            companyId: companyId
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
        hasFullAccess: structure.hasFullAccess
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

// Función de prueba para verificar la obtención de sucursales desde rs_branch_brand
export const testBranchBrandRelations = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: "Se requiere brandId",
      });
    }

    // Obtener las relaciones marca-sucursal para la marca especificada
    const branchBrandRelations = await RsBranchBrand.find({
      brandId: brandId
    }).populate('branchId');

    // Extraer información de las sucursales
    const branches = branchBrandRelations
      .filter(relation => relation.branchId && relation.branchId._id)
      .map(relation => ({
        branchId: relation.branchId._id,
        branchName: relation.branchId.name,
        companyId: relation.branchId.companyId,
        brandId: relation.brandId
      }));

    res.json({
      success: true,
      data: {
        brandId,
        totalRelations: branchBrandRelations.length,
        branches
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
