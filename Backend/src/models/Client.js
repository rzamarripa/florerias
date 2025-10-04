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
    }]
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

// Indexes for search optimization
clientSchema.index({ phoneNumber: 1 });
clientSchema.index({ status: 1 });

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