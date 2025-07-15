import mongoose from "mongoose";
import { Budget } from "../models/Budget.js";
import { Branch } from "../models/Branch.js";

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

export const getBudgetTree = async (req, res) => {
  try {
    const { month, userId } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month parameter required. Use YYYY-MM format",
      });
    }

    const Category = mongoose.model("cc_category");
    const Company = mongoose.model("cc_companies");
    const Brand = mongoose.model("cc_brand");
    const Branch = mongoose.model("cc_branch");
    const Route = mongoose.model("cc_route");
    const RoleVisibility = mongoose.model("ac_user_visibility");

    let visibility = null;
    if (userId) {
      visibility = await RoleVisibility.findOne({ userId });
    }

    const categories = await Category.find({ isActive: true });
    const budgets = await Budget.find({ month })
      .populate("categoryId")
      .populate("companyId")
      .populate("brandId")
      .populate("branchId")
      .populate("routeId");

    const budgetMap = new Map();
    budgets.forEach((budget) => {
      const key = budget.routeId
        ? `route_${budget.routeId._id}`
        : `branch_${budget.branchId._id}`;
      budgetMap.set(key, budget);
    });

    const tree = [];

    for (const category of categories) {
      const categoryNode = {
        id: `category_${category._id}`,
        text: category.name,
        type: "category",
        hasRoutes: category.hasRoutes,
        total: 0,
        children: [],
      };

      const companyBrandRelations = await mongoose
        .model("rs_company_brand")
        .find()
        .populate("companyId")
        .populate({
          path: "brandId",
          populate: {
            path: "categoryId",
            model: "cc_category",
          },
        });

      const relevantRelations = companyBrandRelations.filter(
        (rel) =>
          rel.brandId?.categoryId?._id.toString() === category._id.toString()
      );

      const companyMap = new Map();

      for (const relation of relevantRelations) {
        const company = relation.companyId;
        const brand = relation.brandId;

        if (!company || !brand) continue;

        if (visibility) {
          if (!visibility.hasAccessToCompany(company._id)) continue;
          if (!visibility.hasAccessToBrand(company._id, brand._id)) continue;
        }

        if (!companyMap.has(company._id.toString())) {
          companyMap.set(company._id.toString(), {
            id: `company_${company._id}`,
            text: company.name,
            type: "company",
            total: 0,
            children: [],
          });
        }

        const companyNode = companyMap.get(company._id.toString());

        if (category.hasRoutes) {
          const branchBrandRelations = await mongoose
            .model("rs_branch_brand")
            .find({
              brandId: brand._id,
            })
            .populate("branchId");

          const relevantBranches = branchBrandRelations.filter(
            (rel) =>
              rel.branchId?.companyId?.toString() === company._id.toString()
          );

          for (const branchRelation of relevantBranches) {
            const branch = branchRelation.branchId;

            if (!branch || !branch.isActive) continue;

            if (
              visibility &&
              !visibility.hasAccessToBranch(company._id, brand._id, branch._id)
            ) {
              continue;
            }

            let branchNode = companyNode.children.find(
              (child) => child.id === `branch_${branch._id}`
            );

            if (!branchNode) {
              branchNode = {
                id: `branch_${branch._id}`,
                text: branch.name,
                type: "branch",
                total: 0,
                children: [],
              };
              companyNode.children.push(branchNode);
            }

            let brandNode = branchNode.children.find(
              (child) => child.id === `brand_${brand._id}`
            );

            if (!brandNode) {
              brandNode = {
                id: `brand_${brand._id}`,
                text: brand.name,
                type: "brand",
                total: 0,
                children: [],
              };
              branchNode.children.push(brandNode);
            }

            const routes = await Route.find({
              categoryId: category._id,
              companyId: company._id,
              brandId: brand._id,
              branchId: branch._id,
              status: true,
            });

            for (const route of routes) {
              const budget = budgetMap.get(`route_${route._id}`);
              const routeNode = {
                id: `route_${route._id}`,
                text: route.name,
                type: "route",
                budgetAmount: budget ? budget.assignedAmount : 0,
                canAssignBudget: true,
                entityIds: {
                  categoryId: category._id,
                  companyId: company._id,
                  brandId: brand._id,
                  branchId: branch._id,
                  routeId: route._id,
                },
              };

              brandNode.children.push(routeNode);
            }
            brandNode.total = brandNode.children.reduce(
              (sum, child) => sum + (child.budgetAmount || 0),
              0
            );
            branchNode.total = branchNode.children.reduce(
              (sum, child) => sum + (child.total || 0),
              0
            );
          }
          companyNode.total = companyNode.children.reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
        } else {
          let brandNode = companyNode.children.find(
            (child) => child.id === `brand_${brand._id}`
          );

          if (!brandNode) {
            brandNode = {
              id: `brand_${brand._id}`,
              text: brand.name,
              type: "brand",
              total: 0,
              children: [],
            };
            companyNode.children.push(brandNode);
          }

          const branchBrandRelations = await mongoose
            .model("rs_branch_brand")
            .find({
              brandId: brand._id,
            })
            .populate("branchId");

          const relevantBranches = branchBrandRelations.filter(
            (rel) =>
              rel.branchId?.companyId?.toString() === company._id.toString()
          );

          for (const branchRelation of relevantBranches) {
            const branch = branchRelation.branchId;

            if (!branch || !branch.isActive) continue;

            if (
              visibility &&
              !visibility.hasAccessToBranch(company._id, brand._id, branch._id)
            ) {
              continue;
            }

            const budget = budgetMap.get(`branch_${branch._id}`);
            const branchNode = {
              id: `branch_${branch._id}`,
              text: branch.name,
              type: "branch",
              budgetAmount: budget ? budget.assignedAmount : 0,
              canAssignBudget: true,
              entityIds: {
                categoryId: category._id,
                companyId: company._id,
                brandId: brand._id,
                branchId: branch._id,
              },
            };

            brandNode.children.push(branchNode);
          }
          brandNode.total = brandNode.children.reduce(
            (sum, child) => sum + (child.budgetAmount || 0),
            0
          );
          companyNode.total = companyNode.children.reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
        }
      }

      categoryNode.children = Array.from(companyMap.values());
      categoryNode.total = categoryNode.children.reduce(
        (sum, child) => sum + (child.total || 0),
        0
      );

      delete categoryNode.total;

      if (categoryNode.children.length > 0) {
        tree.push(categoryNode);
      }
    }

    res.json({
      success: true,
      data: tree,
      message: "Budget tree retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting budget tree:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving budget tree",
      error: error.message,
    });
  }
};

// Nuevo endpoint: obtener presupuesto asignado por sucursal (o todas) para un mes
export const getBudgetByBranch = async (req, res) => {
  try {
    const { companyId, branchId, month } = req.query;
    if (!companyId || !month) {
      return res.status(400).json({ success: false, message: 'companyId y month son requeridos' });
    }
    const filter = { companyId, month };
    if (branchId) {
      filter.branchId = branchId;
    }
    // Sumar todos los presupuestos asignados para la(s) sucursal(es) y mes
    const budgets = await Budget.find(filter);
    const assignedAmount = budgets.reduce((sum, b) => sum + (b.assignedAmount || 0), 0);
    res.status(200).json({ success: true, data: { assignedAmount } });
  } catch (error) {
    console.error('Error en getBudgetByBranch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
