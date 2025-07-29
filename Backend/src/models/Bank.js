import mongoose from "mongoose";
const { Schema } = mongoose;

const bankSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  bankNumber: {
    type: Number,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return v.toString().length === 3;
      },
      message: "El número del banco debe tener exactamente 3 dígitos",
    },
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

bankSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "es", strength: 2 },
  }
);

bankSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Bank = mongoose.model("cc_bank", bankSchema);

export { Bank };
