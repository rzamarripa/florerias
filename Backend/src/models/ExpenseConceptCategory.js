import mongoose from "mongoose";
const { Schema } = mongoose;

const expenseConceptCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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
});

const ExpenseConceptCategory = mongoose.model(
  "cc_expense_concept_category",
  expenseConceptCategorySchema
);

export { ExpenseConceptCategory };
