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

budgetSchema.index(
  {
    routeId: 1,
    brandId: 1,
    companyId: 1,
    branchId: 1,
    categoryId: 1,
    month: 1,
  },
  { unique: true }
);

budgetSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

budgetSchema.statics.getBudgetByFilters = async function (filters) {
  return this.find(filters)
    .populate("routeId")
    .populate("brandId")
    .populate("companyId")
    .populate("branchId")
    .populate("categoryId");
};

budgetSchema.statics.getBudgetsByMonth = async function (month) {
  return this.find({ month })
    .populate("routeId")
    .populate("brandId")
    .populate("companyId")
    .populate("branchId")
    .populate("categoryId");
};

budgetSchema.statics.getBudgetsByCategory = async function (categoryId, month) {
  const query = { categoryId };
  if (month) query.month = month;

  return this.find(query)
    .populate("routeId")
    .populate("brandId")
    .populate("companyId")
    .populate("branchId")
    .populate("categoryId");
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
