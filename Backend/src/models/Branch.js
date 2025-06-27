import mongoose from "mongoose";
const { Schema } = mongoose;

const branchSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "cc_companies",
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

branchSchema.index({ name: 1, companyId: 1 }, { unique: true });

branchSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const { Company } = await import("./Company.js");
    const { Brand } = await import("./Brand.js");
    const { Country } = await import("./Country.js");
    const { State } = await import("./State.js");
    const { Municipality } = await import("./Municipality.js");
    const { RsCompanyBrand } = await import("./CompanyBrands.js");

    const company = await Company.findOne({ name: "Example Corp" });
    let brand = null;
    if (company) {
      const relation = await RsCompanyBrand.findOne({ companyId: company._id });
      if (relation) {
        brand = await Brand.findById(relation.brandId);
      }
    }
    const country = await Country.findOne({ name: "México" });
    const state = country
      ? await State.findOne({ countryId: country._id })
      : null;
    const municipality = state
      ? await Municipality.findOne({ stateId: state._id })
      : null;

    const seedData = [];
    if (company && brand && country && state && municipality) {
      seedData.push({
        companyId: company._id,
        brandId: brand._id,
        name: "Sucursal Central",
        countryId: country._id,
        stateId: state._id,
        municipalityId: municipality._id,
        address: "Av. Reforma 123, Col. Centro",
        phone: "+52 55 1234 5678",
        email: "central@example.com",
        description: "Sucursal principal de Example Corp en México",
      });
    }
    if (seedData.length > 0) {
      await this.create(seedData);
    }
  }
};

const Branch = mongoose.model("cc_branch", branchSchema);

export { Branch };
