import { RoleVisibility } from "../models/RoleVisibility.js";
import { Role } from "../models/Roles.js";
import { Company } from "../models/Company.js";
import { Brand } from "../models/Brand.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";
import { Branch } from "../models/Branch.js";

// Obtener la estructura jerárquica completa sin filtrar por rol
export const getAllStructure = async (req, res) => {
  try {
    // Obtener todas las compañías activas
    const companies = await Company.find({ isActive: true });
    const structure = { companies: {} };

    // Procesar cada compañía
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
        if (!brand || !brand._id) continue;

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
          structure.companies[company._id].brands[brand._id].branches[
            branch._id
          ] = {
            name: branch.name,
          };
        }
      }
    }

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

// Obtener la estructura jerárquica de visibilidad para un rol
export const getRoleVisibilityStructure = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Verificar que el rol existe
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    // Obtener o crear la configuración de visibilidad
    let visibility = await RoleVisibility.findOne({ roleId });
    if (!visibility) {
      // Si no existe, crear una con acceso total (arrays vacíos)
      try {
        visibility = await RoleVisibility.create({ roleId });
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

// Actualizar la visibilidad de un rol
export const updateRoleVisibility = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { companies, brands, branches } = req.body;

    // Verificar que el rol existe
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    // Actualizar o crear la configuración de visibilidad
    const visibility = await RoleVisibility.findOneAndUpdate(
      { roleId },
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

// Verificar acceso a una entidad específica
export const checkAccess = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { companyId, brandId, branchId } = req.query;

    const visibility = await RoleVisibility.findOne({ roleId });
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
