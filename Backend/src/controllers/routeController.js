import { Route } from "../models/Route.js";
import { Brand } from "../models/Brand.js";
import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";
import { Category } from "../models/Category.js";
import { RoleVisibility } from "../models/RoleVisibility.js";
import { User } from "../models/User.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";
import { RsBranchBrand } from "../models/BranchBrands.js";

export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find()
      .populate("categoryId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId");

    res.json({
      success: true,
      data: routes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting routes:", error);
    res.status(500).json({
      success: false,
      message: "Error getting routes",
      error: error.message,
    });
  }
};

export const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id)
      .populate("categoryId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId");

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      data: route,
      message: "Route retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting route:", error);
    res.status(500).json({
      success: false,
      message: "Error getting route",
      error: error.message,
    });
  }
};

export const createRoute = async (req, res) => {
  try {
    const routeData = req.body;

    if (!routeData.name || !routeData.categoryId || !routeData.brandId || !routeData.companyId || !routeData.branchId) {
      return res.status(400).json({
        success: false,
        message: "Name, categoryId, brandId, companyId, and branchId are required",
      });
    }

    const existingRoute = await Route.findOne({
      name: routeData.name,
      categoryId: routeData.categoryId,
      brandId: routeData.brandId,
      companyId: routeData.companyId,
      branchId: routeData.branchId,
    });

    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: "Route already exists with this name for the specified category, brand, company, and branch",
      });
    }

    const newRoute = new Route(routeData);
    await newRoute.save();

    const populatedRoute = await Route.findById(newRoute._id)
      .populate("categoryId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId");

    res.status(201).json({
      success: true,
      data: populatedRoute,
      message: "Route created successfully",
    });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({
      success: false,
      message: "Error creating route",
      error: error.message,
    });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const route = await Route.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("categoryId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId");

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      data: route,
      message: "Route updated successfully",
    });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({
      success: false,
      message: "Error updating route",
      error: error.message,
    });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting route",
      error: error.message,
    });
  }
};

export const getRoutesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const routes = await Route.getRoutesByCategory(categoryId);

    res.json({
      success: true,
      data: routes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting routes by category:", error);
    res.status(500).json({
      success: false,
      message: "Error getting routes by category",
      error: error.message,
    });
  }
};

export const getRoutesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const routes = await Route.getRoutesByBranch(branchId);

    res.json({
      success: true,
      data: routes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting routes by branch:", error);
    res.status(500).json({
      success: false,
      message: "Error getting routes by branch",
      error: error.message,
    });
  }
};

export const getRoutesByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    const routes = await Route.getRoutesByBrand(brandId);

    res.json({
      success: true,
      data: routes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting routes by brand:", error);
    res.status(500).json({
      success: false,
      message: "Error getting routes by brand",
      error: error.message,
    });
  }
};

export const getRoutesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const routes = await Route.getRoutesByCompany(companyId);

    res.json({
      success: true,
      data: routes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting routes by company:", error);
    res.status(500).json({
      success: false,
      message: "Error getting routes by company",
      error: error.message,
    });
  }
};

export const getCategoriesForRoutes = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      const categories = await Category.find({ 
        isActive: true, 
        hasRoutes: true 
      });
      
      return res.json({
        success: true,
        data: categories,
        message: "Categories retrieved successfully",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const visibility = await RoleVisibility.findOne({ userId });

    if (!visibility) {
      const categories = await Category.find({ 
        isActive: true, 
        hasRoutes: true 
      });
      
      return res.json({
        success: true,
        data: categories,
        message: "Categories retrieved successfully",
      });
    }

    const structure = await visibility.getHierarchicalStructure();
    
    const brandIds = [];
    Object.entries(structure.companies).forEach(([companyId, company]) => {
      Object.keys(company.brands).forEach(brandId => {
        brandIds.push(brandId);
      });
    });

    const brandsWithCategories = await Brand.find({
      _id: { $in: brandIds },
      categoryId: { $exists: true },
    }).populate("categoryId");

    const categoryIds = new Set();
    brandsWithCategories.forEach((brand) => {
      if (brand.categoryId && brand.categoryId.hasRoutes) {
        categoryIds.add(brand.categoryId._id.toString());
      }
    });

    const categories = await Category.find({
      _id: { $in: Array.from(categoryIds) },
      isActive: true,
      hasRoutes: true,
    });

    res.json({
      success: true,
      data: categories,
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting categories for routes:", error);
    res.status(500).json({
      success: false,
      message: "Error getting categories for routes",
      error: error.message,
    });
  }
};

export const getCompaniesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      const brands = await Brand.find({ 
        categoryId, 
        isActive: true 
      });
      
      const brandIds = brands.map(brand => brand._id);
      const companyBrandRelations = await RsCompanyBrand.find({
        brandId: { $in: brandIds }
      }).populate('companyId', 'name legalRepresentative');
      
      const companyIds = new Set();
      companyBrandRelations.forEach(relation => {
        if (relation.companyId && relation.companyId.isActive !== false) {
          companyIds.add(relation.companyId._id.toString());
        }
      });

      const companies = await Company.find({
        _id: { $in: Array.from(companyIds) },
        isActive: true,
      });

      return res.json({
        success: true,
        data: companies,
        message: "Companies retrieved successfully",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const visibility = await RoleVisibility.findOne({ userId });

    if (!visibility) {
      const brands = await Brand.find({ 
        categoryId, 
        isActive: true 
      });
      
      const brandIds = brands.map(brand => brand._id);
      const companyBrandRelations = await RsCompanyBrand.find({
        brandId: { $in: brandIds }
      }).populate('companyId', 'name legalRepresentative');
      
      const companyIds = new Set();
      companyBrandRelations.forEach(relation => {
        if (relation.companyId && relation.companyId.isActive !== false) {
          companyIds.add(relation.companyId._id.toString());
        }
      });

      const companies = await Company.find({
        _id: { $in: Array.from(companyIds) },
        isActive: true,
      });

      return res.json({
        success: true,
        data: companies,
        message: "Companies retrieved successfully",
      });
    }

    const structure = await visibility.getHierarchicalStructure();
    
    // Primero obtener todos los brandIds de la estructura del usuario
    const userBrandIds = [];
    Object.entries(structure.companies).forEach(([companyId, company]) => {
      Object.keys(company.brands).forEach(brandId => {
        userBrandIds.push(brandId);
      });
    });

    // Obtener brands que pertenecen a la categoría especificada
    const brandsInCategory = await Brand.find({
      _id: { $in: userBrandIds },
      categoryId: categoryId,
      isActive: true,
    });

    // Obtener las relaciones company-brand para estos brands
    const brandIdsInCategory = brandsInCategory.map(brand => brand._id);
    const companyBrandRelations = await RsCompanyBrand.find({
      brandId: { $in: brandIdsInCategory }
    }).populate('companyId', '_id name');

    // Extraer companyIds únicos de esas relaciones
    const companyIds = new Set();
    companyBrandRelations.forEach(relation => {
      if (relation.companyId && relation.companyId.isActive !== false) {
        companyIds.add(relation.companyId._id.toString());
      }
    });

    // Filtrar solo las companies que están en la estructura del usuario
    const filteredCompanyIds = Array.from(companyIds).filter(companyId => 
      structure.companies[companyId]
    );

    const companies = await Company.find({
      _id: { $in: filteredCompanyIds },
      isActive: true,
    });

    res.json({
      success: true,
      data: companies,
      message: "Companies retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting companies by category:", error);
    res.status(500).json({
      success: false,
      message: "Error getting companies by category",
      error: error.message,
    });
  }
};

export const getBrandsByCategoryAndCompany = async (req, res) => {
  try {
    const { categoryId, companyId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      // Obtener brands a través de las relaciones company-brand
      const companyBrandRelations = await RsCompanyBrand.find({
        companyId: companyId
      }).populate('brandId');

      const brands = companyBrandRelations
        .filter(relation => 
          relation.brandId && 
          relation.brandId.isActive && 
          relation.brandId.categoryId && 
          relation.brandId.categoryId.toString() === categoryId
        )
        .map(relation => relation.brandId);

      return res.json({
        success: true,
        data: brands,
        message: "Brands retrieved successfully",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const visibility = await RoleVisibility.findOne({ userId });

    if (!visibility) {
      // Obtener brands a través de las relaciones company-brand
      const companyBrandRelations = await RsCompanyBrand.find({
        companyId: companyId
      }).populate('brandId');

      const brands = companyBrandRelations
        .filter(relation => 
          relation.brandId && 
          relation.brandId.isActive && 
          relation.brandId.categoryId && 
          relation.brandId.categoryId.toString() === categoryId
        )
        .map(relation => relation.brandId);

      return res.json({
        success: true,
        data: brands,
        message: "Brands retrieved successfully",
      });
    }

    const structure = await visibility.getHierarchicalStructure();
    
    const filteredBrands = [];
    if (structure.companies[companyId]) {
      Object.entries(structure.companies[companyId].brands).forEach(([brandId, brandData]) => {
        filteredBrands.push({
          _id: brandId,
          name: brandData.name,
        });
      });
    }

    const brandIds = filteredBrands.map(b => b._id);
    const brands = await Brand.find({
      _id: { $in: brandIds },
      categoryId,
      isActive: true,
    });

    res.json({
      success: true,
      data: brands,
      message: "Brands retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting brands by category and company:", error);
    res.status(500).json({
      success: false,
      message: "Error getting brands by category and company",
      error: error.message,
    });
  }
};

export const getBranchesByCompanyAndBrand = async (req, res) => {
  try {
    const { companyId, brandId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      // Obtener sucursales a través de las relaciones branch-brand
      const branchBrandRelations = await RsBranchBrand.find({
        brandId: brandId
      }).populate('branchId');

      const branches = branchBrandRelations
        .filter(relation => 
          relation.branchId && 
          relation.branchId.isActive && 
          relation.branchId.companyId && 
          relation.branchId.companyId.toString() === companyId
        )
        .map(relation => relation.branchId);

      return res.json({
        success: true,
        data: branches,
        message: "Branches retrieved successfully",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const visibility = await RoleVisibility.findOne({ userId });

    if (!visibility) {
      // Obtener sucursales a través de las relaciones branch-brand
      const branchBrandRelations = await RsBranchBrand.find({
        brandId: brandId
      }).populate('branchId');

      const branches = branchBrandRelations
        .filter(relation => 
          relation.branchId && 
          relation.branchId.isActive && 
          relation.branchId.companyId && 
          relation.branchId.companyId.toString() === companyId
        )
        .map(relation => relation.branchId);

      return res.json({
        success: true,
        data: branches,
        message: "Branches retrieved successfully",
      });
    }

    const structure = await visibility.getHierarchicalStructure();
    
    const filteredBranches = [];
    if (structure.companies[companyId] && structure.companies[companyId].brands[brandId]) {
      Object.entries(structure.companies[companyId].brands[brandId].branches).forEach(([branchId, branchData]) => {
        filteredBranches.push({
          _id: branchId,
          name: branchData.name,
        });
      });
    }

    const branchIds = filteredBranches.map(b => b._id);
    const branches = await Branch.find({
      _id: { $in: branchIds },
      companyId,
      isActive: true,
    });

    res.json({
      success: true,
      data: branches,
      message: "Branches retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting branches by company and brand:", error);
    res.status(500).json({
      success: false,
      message: "Error getting branches by company and brand",
      error: error.message,
    });
  }
};