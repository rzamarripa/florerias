import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  legalRepresentative: {
    type: String,
    required: true,
  },
  rfc: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
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

companySchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create([
      {
        name: "Example Corp",
        legalRepresentative: "Example Corporation Inc.",
        address: "123 Main Street, City, Country",
        rfc: "23dqse23de"
      },
      {
        name: "Walmart",
        legalRepresentative: "Walmart corp.",
        address: "mexico 68",
        rfc: "h378egh23euiqwh"
      }
    ]);
  }
};

const Company = mongoose.model("cc_company", companySchema);

export { Company };