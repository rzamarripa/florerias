import mongoose from "mongoose";
import { RsBranchBrand } from "../models/BranchBrands.js";
import { Budget } from "../models/Budget.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";
import { Route } from "../models/Route.js";

// Obtener companies que tienen marcas en una categoría específica
export const getCompaniesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const companyBrandRelations = await RsCompanyBrand.find()
      .populate("companyId")
      .populate({
        path: "brandId",
        populate: {
          path: "categoryId",
          model: "cc_category",
        },
      });

    const companies = companyBrandRelations
      .filter((rel) => rel.brandId?.categoryId?._id.toString() === categoryId)
      .map((rel) => rel.companyId)
      .filter(
        (company, index, self) =>
          company &&
          self.findIndex((c) => c._id.toString() === company._id.toString()) ===
            index
      );

    res.json({
      success: true,
      data: companies,
      message: "Companies retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getCompaniesByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving companies by category",
      error: error.message,
    });
  }
};

// Obtener marcas por categoría y company
export const getBrandsByCategoryAndCompany = async (req, res) => {
  try {
    const { categoryId, companyId } = req.params;

    const companyBrandRelations = await RsCompanyBrand.find({
      companyId: companyId,
    }).populate({
      path: "brandId",
      populate: {
        path: "categoryId",
        model: "cc_category",
      },
    });

    const brands = companyBrandRelations
      .filter((rel) => rel.brandId?.categoryId?._id.toString() === categoryId)
      .map((rel) => rel.brandId);

    res.json({
      success: true,
      data: brands,
      message: "Brands retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getBrandsByCategoryAndCompany:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving brands by category and company",
      error: error.message,
    });
  }
};

// Obtener sucursales por company y brand
export const getBranchesByCompanyAndBrand = async (req, res) => {
  try {
    const { companyId, brandId } = req.params;

    const branchBrandRelations = await RsBranchBrand.find({
      brandId: brandId,
    }).populate({
      path: "branchId",
      populate: {
        path: "companyId",
        model: "cc_companies",
      },
    });

    const branches = branchBrandRelations
      .filter((rel) => rel.branchId?.companyId?._id.toString() === companyId)
      .map((rel) => rel.branchId);

    res.json({
      success: true,
      data: branches,
      message: "Branches retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getBranchesByCompanyAndBrand:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving branches by company and brand",
      error: error.message,
    });
  }
};

// Obtener rutas por company, brand y branch
export const getRoutesByCompanyBrandAndBranch = async (req, res) => {
  try {
    const { companyId, brandId, branchId } = req.params;

    const routes = await Route.find({
      companyId: companyId,
      brandId: brandId,
      branchId: branchId,
      status: true,
    });

    res.json({
      success: true,
      data: routes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getRoutesByCompanyBrandAndBranch:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving routes by company, brand and branch",
      error: error.message,
    });
  }
};

// Función eliminada - reemplazada por selects en cascada

export const getBudgetsByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    const { companyId, categoryId, branchId, routeId, brandId } = req.query;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    if (companyId && categoryId && brandId) {
      const Category = mongoose.model("cc_category");
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
      const filter = {
        companyId,
        categoryId,
        brandId,
        month,
      };
      if (category.hasRoutes) {
        if (!routeId) {
          return res.status(400).json({
            success: false,
            message: "routeId is required for categories with routes",
          });
        }
        filter.routeId = routeId;
      } else {
        if (!branchId) {
          return res.status(400).json({
            success: false,
            message: "branchId is required for categories without routes",
          });
        }
        filter.branchId = branchId;
      }
      const budgets = await Budget.getBudgetByFilters(filter);
      return res.json({
        success: true,
        data: budgets,
        message: "Budgets retrieved successfully",
      });
    }

    return res.json({
      success: true,
      data: [],
      message: "Filtros insuficientes para obtener presupuesto específico",
    });
  } catch (error) {
    console.error("Error getting budgets by month:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving budgets by month",
      error: error.message,
    });
  }
};

export const getBudgetsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { month, companyId, branchId, routeId, brandId } = req.query;

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    if (companyId && brandId) {
      const Category = mongoose.model("cc_category");
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
      const filter = {
        companyId,
        categoryId,
        brandId,
      };
      if (month) filter.month = month;
      if (category.hasRoutes) {
        if (!routeId) {
          return res.status(400).json({
            success: false,
            message: "routeId is required for categories with routes",
          });
        }
        filter.routeId = routeId;
      } else {
        if (!branchId) {
          return res.status(400).json({
            success: false,
            message: "branchId is required for categories without routes",
          });
        }
        filter.branchId = branchId;
      }
      const budgets = await Budget.getBudgetByFilters(filter);
      return res.json({
        success: true,
        data: budgets,
        message: "Budgets retrieved successfully",
      });
    }

    return res.json({
      success: true,
      data: [],
      message: "Filtros insuficientes para obtener presupuesto específico",
    });
  } catch (error) {
    console.error("Error getting budgets by category:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving budgets by category",
      error: error.message,
    });
  }
};

export const createBudget = async (req, res) => {
  try {
    const budgetData = req.body;

    if (!/^\d{4}-\d{2}$/.test(budgetData.month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    if (!budgetData.assignedAmount || budgetData.assignedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Assigned amount must be greater than 0",
      });
    }

    try {
      await Budget.validateBudgetData(budgetData);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    const Category = mongoose.model("cc_category");
    const category = await Category.findById(budgetData.categoryId);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    const searchFilter = {
      brandId: budgetData.brandId,
      companyId: budgetData.companyId,
      categoryId: budgetData.categoryId,
      month: budgetData.month,
    };

    if (category.hasRoutes) {
      searchFilter.routeId = budgetData.routeId;
    } else {
      searchFilter.branchId = budgetData.branchId;
    }

    const existingBudget = await Budget.findOne(searchFilter);

    if (existingBudget) {
      existingBudget.assignedAmount = budgetData.assignedAmount;
      await existingBudget.save();

      const populatedBudget = await Budget.findById(existingBudget._id)
        .populate("routeId")
        .populate("brandId")
        .populate("companyId")
        .populate("branchId")
        .populate("categoryId");

      return res.json({
        success: true,
        data: populatedBudget,
        message: "Budget updated successfully",
      });
    }

    const newBudgetData = {
      brandId: budgetData.brandId,
      companyId: budgetData.companyId,
      categoryId: budgetData.categoryId,
      assignedAmount: budgetData.assignedAmount,
      month: budgetData.month,
    };

    if (category.hasRoutes) {
      newBudgetData.routeId = budgetData.routeId;
      if (budgetData.routeId) {
        const Route = mongoose.model("cc_route");
        const route = await Route.findById(budgetData.routeId);
        if (route && route.branchId) {
          newBudgetData.branchId = route.branchId;
        } else {
          return res.status(400).json({
            success: false,
            message: "Route not found or route does not have a branch assigned",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "RouteId is required for categories with routes",
        });
      }
    } else {
      newBudgetData.branchId = budgetData.branchId;
      newBudgetData.routeId = null;
    }

    const newBudget = new Budget(newBudgetData);
    await newBudget.save();

    const populatedBudget = await Budget.findById(newBudget._id)
      .populate("routeId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId")
      .populate("categoryId");

    res.status(201).json({
      success: true,
      data: populatedBudget,
      message: "Budget created successfully",
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({
      success: false,
      message: "Error creating budget",
      error: error.message,
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.month && !/^\d{4}-\d{2}$/.test(updateData.month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    if (
      updateData.assignedAmount !== undefined &&
      updateData.assignedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Assigned amount must be greater than 0",
      });
    }

    const currentBudget = await Budget.findById(id);
    if (!currentBudget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    if (
      updateData.categoryId ||
      updateData.routeId !== undefined ||
      updateData.branchId !== undefined
    ) {
      const validationData = {
        categoryId: updateData.categoryId || currentBudget.categoryId,
        routeId:
          updateData.routeId !== undefined
            ? updateData.routeId
            : currentBudget.routeId,
        brandId: updateData.brandId || currentBudget.brandId,
        companyId: updateData.companyId || currentBudget.companyId,
        branchId:
          updateData.branchId !== undefined
            ? updateData.branchId
            : currentBudget.branchId,
      };

      try {
        await Budget.validateBudgetData(validationData);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message,
        });
      }
    }

    const budget = await Budget.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("routeId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId")
      .populate("categoryId");

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.json({
      success: true,
      data: budget,
      message: "Budget updated successfully",
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({
      success: false,
      message: "Error updating budget",
      error: error.message,
    });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findByIdAndDelete(id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting budget",
      error: error.message,
    });
  }
};

export const calculateParentTotal = async (req, res) => {
  try {
    const { parentType, parentId } = req.params;
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month parameter required. Use YYYY-MM format",
      });
    }

    const validParentTypes = ["categoryId", "companyId", "branchId", "brandId"];
    if (!validParentTypes.includes(parentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent type",
      });
    }

    const total = await Budget.calculateTotalByParent(
      parentType,
      parentId,
      month
    );

    res.json({
      success: true,
      data: total,
      message: "Parent total calculated successfully",
    });
  } catch (error) {
    console.error("Error calculating parent total:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating parent total",
      error: error.message,
    });
  }
};

export const getMonthlyBudgetByBranch = async (req, res) => {
  try {
    const { branchId, month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    const budgets = await Budget.find({ branchId, month })
      .populate("routeId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId")
      .populate("categoryId");

    const totalAmount = budgets.reduce(
      (sum, budget) => sum + budget.assignedAmount,
      0
    );

    res.json({
      success: true,
      data: {
        budgets,
        totalAmount,
        branchId,
        month,
        count: budgets.length,
      },
      message: "Monthly budget by branch retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting monthly budget by branch:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving monthly budget by branch",
      error: error.message,
    });
  }
};
