import mongoose from "mongoose";
const { Schema } = mongoose;

const expenseConceptSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      enum: ["sales", "administration", "operations", "marketing", "finance", "human_resources", "other"],
      required: [true, "El departamento es requerido"],
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: false,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "La empresa es requerida"],
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
  },
  {
    timestamps: true,
  }
);

// Middleware para actualizar updatedAt
expenseConceptSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índice compuesto para unicidad por empresa
expenseConceptSchema.index({ name: 1, company: 1 }, { unique: true });

// Índices para búsquedas rápidas
expenseConceptSchema.index({ department: 1 });
expenseConceptSchema.index({ company: 1 });
expenseConceptSchema.index({ isActive: 1 });
expenseConceptSchema.index({ createdAt: -1 });

const ExpenseConcept = mongoose.model("cv_expense_concept", expenseConceptSchema);
export { ExpenseConcept };
