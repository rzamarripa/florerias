import mongoose from "mongoose";
const { Schema } = mongoose;

const providerSchema = new Schema({
  commercialName: {
    type: String,
    required: true,
    trim: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  rfc: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
  },
  countryId: {
    type: Schema.Types.ObjectId,
    ref: "cc_country",
    required: true,
  },
  stateId: {
    type: Schema.Types.ObjectId,
    ref: "cc_state",
    required: true,
  },
  municipalityId: {
    type: Schema.Types.ObjectId,
    ref: "cc_municipality",
    required: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
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

providerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Provider = mongoose.model("cc_provider", providerSchema);

export { Provider };
