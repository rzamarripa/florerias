import mongoose from "mongoose";
const { Schema } = mongoose;

const whatsappCompanyConfigSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "El companyId es requerido"],
      unique: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El adminId es requerido"],
    },
    // Datos del negocio
    legalName: {
      type: String,
      required: [true, "La razón social es requerida"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    businessCountry: {
      type: String,
      required: [true, "El país del negocio es requerido"],
      trim: true,
    },
    businessAddress: {
      type: String,
      required: [true, "La dirección del negocio es requerida"],
      trim: true,
    },
    vertical: {
      type: String,
      required: [true, "La vertical es requerida"],
      enum: {
        values: [
          "Retail",
          "Servicios",
          "Restaurantes",
          "Educacion",
          "Salud",
          "Tecnologia",
          "Otro",
        ],
        message: "{VALUE} no es una vertical válida",
      },
    },
    // Datos del contacto
    contactName: {
      type: String,
      required: [true, "El nombre del contacto es requerido"],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "El email del contacto es requerido"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "El formato del email no es válido",
      ],
    },
    facebookAccount: {
      type: String,
      trim: true,
      default: "",
    },
    // Datos de WhatsApp
    phoneNumber: {
      type: String,
      required: [true, "El número de teléfono es requerido"],
      trim: true,
      match: [
        /^\+[1-9]\d{1,14}$/,
        "El número de teléfono debe tener formato E.164 (ej: +521234567890)",
      ],
    },
    displayName: {
      type: String,
      required: [true, "El nombre para mostrar es requerido"],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "cv_whatsapp_company_config",
  }
);

// Middleware para actualizar updatedAt
whatsappCompanyConfigSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índice único para relación 1:1 con empresa
whatsappCompanyConfigSchema.index({ companyId: 1 }, { unique: true });

const WhatsappCompanyConfig = mongoose.model(
  "cv_whatsapp_company_config",
  whatsappCompanyConfigSchema
);
export { WhatsappCompanyConfig };
