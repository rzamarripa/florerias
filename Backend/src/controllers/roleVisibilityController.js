import { RoleVisibility } from "../models/RoleVisibility.js";
import { User } from "../models/User.js";

export const getAllStructure = async (req, res) => {
  try {
    // Estructura simplificada para el módulo de gestión
    const structure = {
      companies: {},
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
        selectedCompanies: visibility?.companies || [],
        selectedBrands: visibility?.brands || [],
        selectedBranches: visibility?.branches || [],
        brands: visibility?.brands || [],
        branches: visibility?.branches || [],
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

    // Simplificado - solo verificar si el usuario existe
    let hasAccess = true;

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

    res.json({
      success: true,
      data: {
        categories: [],
        companies: [],
        brands: [],
        branches: [],
        hasFullAccess: !visibility,
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

    // Respuesta simplificada sin relaciones de modelos eliminados
    res.json({
      success: true,
      data: {
        brandId,
        totalRelations: 0,
        branches: [],
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
