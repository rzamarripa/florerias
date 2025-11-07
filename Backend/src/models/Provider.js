import mongoose from "mongoose";
const { Schema } = mongoose;

const providerSchema = new Schema(
  {
    contactName: {
      type: String,
      required: [true, "El nombre de contacto es requerido"],
      trim: true,
    },
    tradeName: {
      type: String,
      required: [true, "El nombre comercial es requerido"],
      trim: true,
    },
    legalName: {
      type: String,
      required: [true, "El nombre fiscal es requerido"],
      trim: true,
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
    phone: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
    },
    address: {
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
    email: {
      type: String,
      required: [true, "El email es requerido"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "El formato del email no es válido",
      ],
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
providerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
providerSchema.index({ tradeName: 1 });
providerSchema.index({ legalName: 1 });
providerSchema.index({ rfc: 1 });
providerSchema.index({ isActive: 1 });
providerSchema.index({ company: 1 });

const Provider = mongoose.model("cv_provider", providerSchema);
export { Provider };
