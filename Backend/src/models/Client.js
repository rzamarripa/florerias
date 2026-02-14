import mongoose from "mongoose";
const { Schema } = mongoose;

// Function to generate alphanumeric client number
const generateClientNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    clientNumber: {
      type: String,
      required: true,
      unique: true,
      default: generateClientNumber
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un correo válido']
    },
    gender: {
      type: String,
      required: [true, "El género es requerido"],
      enum: {
        values: ['masculino', 'femenino', 'otro'],
        message: 'El género debe ser: masculino, femenino u otro'
      },
      lowercase: true,
      trim: true
    },
    points: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    status: {
      type: Boolean,
      required: true,
      default: true
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "La empresa es requerida"]
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      default: null
    },
    purchases: [{
      type: Schema.Types.ObjectId,
      ref: "cc_purchases"
    }],
    comentarios: [{
      comentario: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      tipo: {
        type: String,
        required: true,
        enum: ['positive', 'negative'],
        lowercase: true
      },
      usuario: {
        type: String,
        required: true,
        trim: true
      },
      fechaCreacion: {
        type: Date,
        default: Date.now
      }
    }],
    rewards: [{
      reward: {
        type: Schema.Types.ObjectId,
        ref: "points_reward",
        required: true
      },
      code: {
        type: String,
        uppercase: true,
        trim: true
      },
      isRedeemed: {
        type: Boolean,
        default: false
      },
      redeemedAt: {
        type: Date,
        default: null
      },
      usedAt: {
        type: Date,
        default: null
      },
      usedInOrder: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        default: null
      }
    }],
    howDidYouHearAboutUs: {
      type: String,
      enum: {
        values: ['redes_sociales', 'recomendacion', 'google_busqueda', 'pasando_por_local', 'volante_publicidad', 'otro', null],
        message: 'El valor debe ser uno de: redes_sociales, recomendacion, google_busqueda, pasando_por_local, volante_publicidad, otro'
      },
      default: null,
      lowercase: true,
      trim: true
    }
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

// Indexes for search optimization (clientNumber already has index from unique: true)
clientSchema.index({ phoneNumber: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ branch: 1 });
clientSchema.index({ gender: 1 });

// Method to get full name
clientSchema.methods.getFullName = function() {
  return `${this.name} ${this.lastName}`;
};

// Method to add points
clientSchema.methods.addPoints = function(points) {
  this.points += points;
  return this.save();
};

// Method to use points
clientSchema.methods.usePoints = function(points) {
  if (this.points >= points) {
    this.points -= points;
    return this.save();
  }
  throw new Error('Insufficient points');
};

const Client = mongoose.model("client", clientSchema);
export { Client };