import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema({
  tradeName: {
    type: String,
    required: true,
  },
  legalName: {
    type: String,
    required: true,
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
        tradeName: "Example Corp",
        legalName: "Example Corporation Inc.",
        address: "123 Main Street, City, Country"
      },
      {
        tradeName: "XYZ Trading Co.",
        legalName: "XYZ Trading Company LLC",
        address: "456 Business Ave, City, Country"
      },
    ]);
  }
};

const Company = mongoose.model("Company", companySchema);

export { Company };