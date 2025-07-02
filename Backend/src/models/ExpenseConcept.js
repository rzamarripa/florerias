import mongoose from "mongoose";
const { Schema } = mongoose;

const expenseConceptSchema = new Schema({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "cc_expense_concept_category",
    required: true,
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: "cc_department",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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

expenseConceptSchema.index({ name: 1, categoryId: 1, departmentId: 1 }, { unique: true });

expenseConceptSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const ExpenseConcept = mongoose.model(
  "cc_expense_concept",
  expenseConceptSchema
);

export { ExpenseConcept };
