import mongoose from "mongoose";
const { Schema } = mongoose;

const stateSchema = new Schema({
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

stateSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

stateSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const { Country } = await import("./Country.js");

    const mexico = await Country.findOne({ name: "México" });
    const usa = await Country.findOne({ name: "Estados Unidos" });

    const seedData = [];

    if (mexico) {
      seedData.push(
        {
          name: "Ciudad de México",
          countryId: mexico._id,
        },
        {
          name: "Nuevo León",
          countryId: mexico._id,
        },
        {
          name: "Yucatán",
          countryId: mexico._id,
        }
      );
    }

    if (usa) {
      seedData.push(
        {
          name: "California",
          countryId: usa._id,
        },
        {
          name: "Texas",
          countryId: usa._id,
        }
      );
    }

    if (seedData.length > 0) {
      await this.create(seedData);
    }
  }
};

stateSchema.index(
  { name: 1, countryId: 1 },
  {
    unique: true,
    collation: { locale: "es", strength: 2 },
  }
);

const State = mongoose.model("cc_state", stateSchema);

export { State };
