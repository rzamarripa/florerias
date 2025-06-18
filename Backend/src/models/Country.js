import mongoose from "mongoose";
const { Schema } = mongoose;

const countrySchema = new Schema({
  name: {
    type: String,
    required: true,
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

countrySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "es", strength: 2 },
  }
);

countrySchema.index({
  unique: true,
  collation: { locale: "es", strength: 2 },
});

countrySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

countrySchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const seedData = [
      {
        name: "México",
      },
      {
        name: "Estados Unidos",
      },
      {
        name: "Canada",
      },
    ];

    await this.create(seedData);
  }
};

const Country = mongoose.model("cc_country", countrySchema);

export { Country };
