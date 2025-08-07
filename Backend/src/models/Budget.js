import mongoose from "mongoose";
const { Schema } = mongoose;

const budgetSchema = new Schema({
  routeId: {
    type: Schema.Types.ObjectId,
    ref: "cc_route",
    required: false,
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "cc_brand",
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "cc_companies",
    required: true,
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: "cc_branch",
    required: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "cc_category",
    required: true,
  },
  expenseConceptId: {
    type: Schema.Types.ObjectId,
    ref: "cc_expense_concept",
    required: true,
  },
  assignedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  month: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{4}-\d{2}$/.test(v);
      },
      message: "Month must be in YYYY-MM format",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice compuesto para categorías con rutas
budgetSchema.index(
  {
    routeId: 1,
    brandId: 1,
    companyId: 1,
    categoryId: 1,
    expenseConceptId: 1,
    month: 1,
  },
  {
    unique: true,
    partialFilterExpression: { routeId: { $exists: true, $ne: null } },
  }
);

// Índice compuesto para categorías sin rutas
budgetSchema.index(
  {
    brandId: 1,
    companyId: 1,
    branchId: 1,
    categoryId: 1,
    expenseConceptId: 1,
    month: 1,
  },
  {
    unique: true,
    partialFilterExpression: { routeId: null },
  }
);

budgetSchema.pre("save", async function (next) {
  this.updatedAt = new Date();

  try {
    // Usar la validación completa que ya tenemos
    await this.constructor.validateBudgetData({
      categoryId: this.categoryId,
      companyId: this.companyId,
      branchId: this.branchId,
      brandId: this.brandId,
      routeId: this.routeId,
      expenseConceptId: this.expenseConceptId,
    });
    next();
  } catch (error) {
    next(error);
  }
});

budgetSchema.statics.validateBudgetData = async function (budgetData) {
  // Obtener modelos usando mongoose.model para evitar problemas de importación circular
  const Category = mongoose.model("cc_category");
  const RsCompanyBrand = mongoose.model("rs_company_brand");
  const RsBranchBrand = mongoose.model("rs_branch_brand");
  const Route = mongoose.model("cc_route");
  const Branch = mongoose.model("cc_branch");
  const ExpenseConcept = mongoose.model("cc_expense_concept");

  // Validar que la categoría existe
  const category = await Category.findById(budgetData.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // Validar que la relación company-brand existe
  const companyBrandRelation = await RsCompanyBrand.findOne({
    companyId: budgetData.companyId,
    brandId: budgetData.brandId,
  }).populate({
    path: "brandId",
    populate: {
      path: "categoryId",
      model: "cc_category",
    },
  });

  if (!companyBrandRelation) {
    throw new Error("The brand is not associated with the specified company");
  }

  // Validar que la brand pertenece a la categoría correcta
  if (
    companyBrandRelation.brandId.categoryId._id.toString() !==
    budgetData.categoryId.toString()
  ) {
    throw new Error("The brand does not belong to the specified category");
  }

  // Validar que la branch pertenece a la company
  const branch = await Branch.findById(budgetData.branchId);
  if (!branch) {
    throw new Error("Branch not found");
  }

  if (branch.companyId.toString() !== budgetData.companyId.toString()) {
    throw new Error("The branch does not belong to the specified company");
  }

  // Validar que existe la relación branch-brand
  const branchBrandRelation = await RsBranchBrand.findOne({
    branchId: budgetData.branchId,
    brandId: budgetData.brandId,
  });

  if (!branchBrandRelation) {
    throw new Error("The brand is not associated with the specified branch");
  }

  // Validar que el concepto de gasto existe
  const expenseConcept = await ExpenseConcept.findById(budgetData.expenseConceptId).populate('categoryId');
  if (!expenseConcept) {
    throw new Error("Expense concept not found");
  }

  if (category.hasRoutes) {
    if (!budgetData.routeId) {
      throw new Error("RouteId is required when category hasRoutes is true");
    }

    // Validar que la route existe y tiene las relaciones correctas
    const route = await Route.findById(budgetData.routeId);
    if (!route) {
      throw new Error("Route not found");
    }

    // Verificar que la route pertenece a la branch correcta
    if (route.branchId.toString() !== budgetData.branchId.toString()) {
      throw new Error("The route does not belong to the specified branch");
    }

    // Verificar que la route pertenece a la company correcta
    if (route.companyId.toString() !== budgetData.companyId.toString()) {
      throw new Error("The route does not belong to the specified company");
    }

    // Verificar que la route pertenece a la brand correcta
    if (route.brandId.toString() !== budgetData.brandId.toString()) {
      throw new Error("The route does not belong to the specified brand");
    }
  } else {
    if (budgetData.routeId) {
      throw new Error(
        "RouteId should not be provided when category hasRoutes is false"
      );
    }
  }

  return true;
};

budgetSchema.statics.getBudgetByFilters = async function (filters) {
  return this.find(filters)
    .populate("routeId")
    .populate("brandId")
    .populate("companyId")
    .populate("branchId")
    .populate("categoryId")
    .populate({
      path: "expenseConceptId",
      populate: {
        path: "categoryId",
        model: "cc_expense_concept_category"
      }
    });
};

budgetSchema.statics.getBudgetsByMonth = async function (month) {
  return this.find({ month })
    .populate("routeId")
    .populate("brandId")
    .populate("companyId")
    .populate("branchId")
    .populate("categoryId")
    .populate({
      path: "expenseConceptId",
      populate: {
        path: "categoryId",
        model: "cc_expense_concept_category"
      }
    });
};

budgetSchema.statics.getBudgetsByCategory = async function (categoryId, month) {
  const query = { categoryId };
  if (month) query.month = month;

  return this.find(query)
    .populate("routeId")
    .populate("brandId")
    .populate("companyId")
    .populate("branchId")
    .populate("categoryId")
    .populate({
      path: "expenseConceptId",
      populate: {
        path: "categoryId",
        model: "cc_expense_concept_category"
      }
    });
};

budgetSchema.statics.calculateTotalByParent = async function (
  parentType,
  parentId,
  month
) {
  const matchCondition = { month };
  matchCondition[parentType] = new mongoose.Types.ObjectId(parentId);

  const result = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total: { $sum: "$assignedAmount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

const Budget = mongoose.model("cc_budget", budgetSchema);

export { Budget };
