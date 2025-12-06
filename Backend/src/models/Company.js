import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema(
  {
    legalName: {
      type: String,
      required: [true, "La razón social es requerida"],
      trim: true,
    },
    tradeName: {
      type: String,
      trim: true,
      default: "",
    },
    rfc: {
      type: String,
      required: [true, "El RFC es requerido"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
        "El formato del RFC no es válido",
      ],
    },
    legalForm: {
      type: String,
      required: [true, "La forma legal es requerida"],
      trim: true,
      enum: {
        values: [
          "S.A. de C.V.",
          "S. de R.L. de C.V.",
          "S.C.",
          "A.C.",
          "S.A.P.I.",
          "S.A.S.",
          "Persona Física",
          "Otro",
        ],
        message: "{VALUE} no es una forma legal válida",
      },
    },
    fiscalAddress: {
      street: {
        type: String,
        required: [true, "La calle es requerida"],
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
    primaryContact: {
      name: {
        type: String,
        required: [true, "El nombre del contacto es requerido"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "El email del contacto es requerido"],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "El formato del email no es válido",
        ],
      },
      phone: {
        type: String,
        required: [true, "El teléfono del contacto es requerido"],
        trim: true,
      },
    },
    branches: [
      {
        type: Schema.Types.ObjectId,
        ref: "cv_branch",
      },
    ],
    administrator: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      default: null,
    },
    distributor: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El distribuidor es requerido"],
    },
    redes: [
      {
        type: Schema.Types.ObjectId,
        ref: "cs_user",
      },
    ],
    logoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    logoPath: {
      type: String,
      trim: true,
      default: null,
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
companySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índice para búsquedas rápidas
companySchema.index({ legalName: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ distributor: 1 });

const Company = mongoose.model("cv_company", companySchema);
export { Company };
