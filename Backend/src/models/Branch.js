import mongoose from "mongoose";
const { Schema } = mongoose;

const branchSchema = new Schema({
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "cc_brand",
    required: true,
  },
  name: {
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
    required: false,
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

branchSchema.index({ name: 1, brandId: 1 }, { unique: true });

branchSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const { Brand } = await import("./Brand.js");

    const nike = await Brand.findOne({ name: "Nike" });

    const seedData = [];

    if (nike) {
      seedData.push({
        businessName: "La Güerita S.A. de C.V.",
        brandId: nike._id,
        name: "Downtown Branch",
        country: "Mexico",
        state: "Mexico City",
        city: "Mexico City",
        address: "Av. Reforma 123, Col. Centro",
        phone: "+52 55 1234 5678",
        email: "downtown@laguerita.com",
        description: "Main branch in downtown area",
      });
    }

    if (seedData.length > 0) {
      await this.create(seedData);
    }
  }
};

const Branch = mongoose.model("cc_branch", branchSchema);

export { Branch };
