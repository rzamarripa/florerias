import { Route } from "../models/Route.js";
import { Brand } from "../models/Brand.js";
import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";
import { Category } from "../models/Category.js";

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