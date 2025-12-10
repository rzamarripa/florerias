import mongoose from "mongoose";
const { Schema } = mongoose;

const branchSchema = new Schema(
  {
    branchName: {
      type: String,
      required: [true, "El nombre de la sucursal es requerido"],
      trim: true,
    },
    branchCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true, // Permite que sea opcional pero único si se proporciona
    },
    rfc: {
      type: String,
      required: [true, "El RFC es requerido"],
      trim: true,
      uppercase: true,
      match: [
        /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
        "El formato del RFC no es válido",
      ],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "La referencia a la empresa es requerida"],
    },
    administrator: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El administrador de la sucursal es requerido"],
    },
    address: {
      street: {
        type: String,
        required: [true, "La calle es requerida"],
        trim: true,
      },
      externalNumber: {
        type: String,
        required: [true, "El número exterior es requerido"],
        trim: true,
      },
      internalNumber: {
        type: String,
        trim: true,
        default: "",
      },
      neighborhood: {
        type: String,
        required: [true, "La colonia es requerida"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "La ciudad es requerida"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "El estado es requerido"],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, "El código postal es requerido"],
        trim: true,
        match: [/^\d{5}$/, "El código postal debe tener 5 dígitos"],
      },
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El gerente es requerido"],
    },
    contactPhone: {
      type: String,
      required: [true, "El teléfono principal es requerido"],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "El email principal es requerido"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "El formato del email no es válido",
      ],
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "cs_user",
      },
    ],
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
branchSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
branchSchema.index({ branchName: 1 });
branchSchema.index({ companyId: 1 });
branchSchema.index({ administrator: 1 });
branchSchema.index({ isActive: 1 });

const Branch = mongoose.model("cv_branch", branchSchema);
export { Branch };
