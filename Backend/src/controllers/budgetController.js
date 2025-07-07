import mongoose from "mongoose";
import { Branch } from "../models/Branch.js";
import { RsBranchBrand } from "../models/BranchBrands.js";
import { Budget } from "../models/Budget.js";
import { Category } from "../models/Category.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";
import { Route } from "../models/Route.js";

export const getBudgetTreeData = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    const branches = await Branch.find({ isActive: true })
      .populate("companyId")
      .populate("countryId")
      .populate("stateId")
      .populate("municipalityId");
    const routes = await Route.find({ status: true })
      .populate("brandId")
      .populate("companyId")
      .populate("branchId");

    const companyBrandRelations = await RsCompanyBrand.find()
      .populate("companyId")
      .populate("brandId");
    const branchBrandRelations = await RsBranchBrand.find()
      .populate("branchId")
      .populate("brandId");

    const treeNodes = [];

    categories.forEach((category) => {
      treeNodes.push({
        id: `category_${category._id}`,
        text: category.name,
        parent: "#",
        type: "category",
        hasRoutes: category.hasRoutes,
        state: { opened: true },
        data: { categoryId: category._id.toString() },
      });

      const categoryCompanies = companyBrandRelations
        .filter(
          (rel) =>
            rel.brandId?.categoryId?.toString() === category._id.toString()
        )
        .map((rel) => rel.companyId)
        .filter(
          (company, index, self) =>
            company &&
            self.findIndex(
              (c) => c._id.toString() === company._id.toString()
            ) === index
        );

      categoryCompanies.forEach((company) => {
        treeNodes.push({
          id: `company_${company._id}`,
          text: company.name,
          parent: `category_${category._id}`,
          type: "company",
          hasRoutes: category.hasRoutes,
          state: { opened: false },
          data: {
            categoryId: category._id.toString(),
            companyId: company._id.toString(),
          },
        });

        if (category.hasRoutes) {
          const companyBranches = branches.filter(
            (branch) =>
              branch.companyId?._id.toString() === company._id.toString()
          );

          companyBranches.forEach((branch) => {
            const branchBrands = branchBrandRelations
              .filter(
                (rel) => rel.branchId?._id.toString() === branch._id.toString()
              )
              .map((rel) => rel.brandId)
              .filter(
                (brand) =>
                  brand?.categoryId?.toString() === category._id.toString()
              );

            branchBrands.forEach((brand) => {
              treeNodes.push({
                id: `branch_${branch._id}_${company._id}_${brand._id}`,
                text: branch.name,
                parent: `company_${company._id}`,
                type: "branch",
                hasRoutes: category.hasRoutes,
                state: { opened: false },
                data: {
                  categoryId: category._id.toString(),
                  companyId: company._id.toString(),
                  branchId: branch._id.toString(),
                  brandId: brand._id.toString(),
                },
              });

              treeNodes.push({
                id: `brand_${brand._id}_${company._id}_${branch._id}`,
                text: brand.name,
                parent: `branch_${branch._id}_${company._id}_${brand._id}`,
                type: "brand",
                hasRoutes: category.hasRoutes,
                state: { opened: false },
                data: {
                  categoryId: category._id.toString(),
                  companyId: company._id.toString(),
                  branchId: branch._id.toString(),
                  brandId: brand._id.toString(),
                },
              });

              const brandRoutes = routes.filter(
                (route) =>
                  route.brandId?._id.toString() === brand._id.toString() &&
                  route.companyId?._id.toString() === company._id.toString() &&
                  route.branchId?._id.toString() === branch._id.toString()
              );

              brandRoutes.forEach((route) => {
                treeNodes.push({
                  id: `route_${route._id}_${company._id}_${brand._id}_${branch._id}`,
                  text: route.name,
                  parent: `brand_${brand._id}_${company._id}_${branch._id}`,
                  type: "route",
                  hasRoutes: category.hasRoutes,
                  state: { opened: false },
                  data: {
                    categoryId: category._id.toString(),
                    companyId: company._id.toString(),
                    branchId: branch._id.toString(),
                    brandId: brand._id.toString(),
                    routeId: route._id.toString(),
                  },
                });
              });
            });
          });
        } else {
          const companyBrands = companyBrandRelations
            .filter(
              (rel) =>
                rel.companyId?._id.toString() === company._id.toString() &&
                rel.brandId?.categoryId?.toString() === category._id.toString()
            )
            .map((rel) => rel.brandId);

          companyBrands.forEach((brand) => {
            treeNodes.push({
              id: `brand_${brand._id}_${company._id}`,
              text: brand.name,
              parent: `company_${company._id}`,
              type: "brand",
              hasRoutes: category.hasRoutes,
              state: { opened: false },
              data: {
                categoryId: category._id.toString(),
                companyId: company._id.toString(),
                brandId: brand._id.toString(),
              },
            });

            const brandBranches = branchBrandRelations
              .filter(
                (rel) => rel.brandId?._id.toString() === brand._id.toString()
              )
              .map((rel) => rel.branchId)
              .filter(
                (branch) =>
                  branch?.companyId?.toString() === company._id.toString()
              );

            brandBranches.forEach((branch) => {
              treeNodes.push({
                id: `branch_${branch._id}_${company._id}_${brand._id}`,
                text: branch.name,
                parent: `brand_${brand._id}_${company._id}`,
                type: "branch",
                hasRoutes: category.hasRoutes,
                state: { opened: false },
                data: {
                  categoryId: category._id.toString(),
                  companyId: company._id.toString(),
                  branchId: branch._id.toString(),
                  brandId: brand._id.toString(),
                },
              });
            });
          });
        }
      });
    });

    

    res.json({
      success: true,
      data: treeNodes,
      message: "Tree data retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting budget tree data:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving tree data",
      error: error.message,
    });
  }
};

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

    // Si se proveen filtros adicionales, aplicar lógica avanzada
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
      console.log("[getBudgetsByMonth] Filtros recibidos:", filter);
      const budgets = await Budget.getBudgetByFilters(filter);
      console.log("[getBudgetsByMonth] Presupuestos devueltos:", budgets.map(b => b._id));
      return res.json({
        success: true,
        data: budgets,
        message: "Budgets retrieved successfully",
      });
    }

    // Si no se pasan todos los filtros, NO devolver presupuestos
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

    // Si se proveen filtros adicionales, aplicar lógica avanzada
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
      console.log("[getBudgetsByCategory] Filtros recibidos:", filter);
      const budgets = await Budget.getBudgetByFilters(filter);
      console.log("[getBudgetsByCategory] Presupuestos devueltos:", budgets.map(b => b._id));
      return res.json({
        success: true,
        data: budgets,
        message: "Budgets retrieved successfully",
      });
    }

    // Si no se pasan todos los filtros, NO devolver presupuestos
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

    // Validar la lógica de negocio antes de crear/actualizar
    try {
      await Budget.validateBudgetData(budgetData);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    // Obtener la categoría para determinar la lógica de negocio
    const Category = mongoose.model("cc_category");
    const category = await Category.findById(budgetData.categoryId);
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    // Construir el filtro de búsqueda basado en la lógica de negocio
    // SIEMPRE incluir companyId para evitar duplicados en múltiples razones sociales
    const searchFilter = {
      brandId: budgetData.brandId,
      companyId: budgetData.companyId, // CRÍTICO: siempre incluir companyId específico
      categoryId: budgetData.categoryId,
      month: budgetData.month,
    };

    // Agregar routeId o branchId según la lógica de la categoría
    if (category.hasRoutes) {
      searchFilter.routeId = budgetData.routeId;
      // Para categorías con rutas, NO incluimos branchId en el filtro de búsqueda
      // porque branchId se obtiene automáticamente de la ruta
    } else {
      searchFilter.branchId = budgetData.branchId;
      // Para categorías sin rutas, NO incluimos routeId en el filtro de búsqueda
      // porque routeId debe ser null
    }

    console.log("Searching for existing budget with filter:", JSON.stringify(searchFilter, null, 2));
    const existingBudget = await Budget.findOne(searchFilter);

    if (existingBudget) {
      console.log("Found existing budget:", existingBudget._id);
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

    // Preparar los datos para el nuevo presupuesto
    // MANTENER SIEMPRE el companyId específico para evitar duplicados
    const newBudgetData = {
      brandId: budgetData.brandId,
      companyId: budgetData.companyId, // CRÍTICO: mantener companyId específico
      categoryId: budgetData.categoryId,
      assignedAmount: budgetData.assignedAmount,
      month: budgetData.month,
    };

    // Asignar routeId o branchId según la lógica de negocio
    if (category.hasRoutes) {
      newBudgetData.routeId = budgetData.routeId;
      // Para categorías con rutas, branchId se obtiene automáticamente de la ruta
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
      // Para categorías sin rutas, routeId debe ser null
      newBudgetData.routeId = null;
    }

    console.log("Creating new budget with data:", JSON.stringify(newBudgetData, null, 2));
    const newBudget = new Budget(newBudgetData);
    await newBudget.save();
    console.log("New budget created with ID:", newBudget._id);

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

    // Obtener el presupuesto actual para validar la lógica de negocio
    const currentBudget = await Budget.findById(id);
    if (!currentBudget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Si se está actualizando categoryId, routeId o branchId, validar la lógica de negocio
    if (updateData.categoryId || updateData.routeId !== undefined || updateData.branchId !== undefined) {
      const validationData = {
        categoryId: updateData.categoryId || currentBudget.categoryId,
        routeId: updateData.routeId !== undefined ? updateData.routeId : currentBudget.routeId,
        brandId: updateData.brandId || currentBudget.brandId,
        companyId: updateData.companyId || currentBudget.companyId,
        branchId: updateData.branchId !== undefined ? updateData.branchId : currentBudget.branchId,
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
