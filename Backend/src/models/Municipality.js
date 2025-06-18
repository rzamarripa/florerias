import mongoose from "mongoose";
const { Schema } = mongoose;

const municipalitySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  stateId: {
    type: Schema.Types.ObjectId,
    ref: "cc_state",
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

municipalitySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

municipalitySchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const { State } = await import("./State.js");

    const cdmx = await State.findOne({ name: "Ciudad de México" });
    const jalisco = await State.findOne({ name: "Jalisco" });
    const yucatan = await State.findOne({ name: "Yucatán" });

    const seedData = [];

    if (cdmx) {
      seedData.push(
        {
          name: "Cuauhtémoc",
          stateId: cdmx._id,
        },
        {
          name: "Miguel Hidalgo",
          stateId: cdmx._id,
        },
        {
          name: "Benito Juárez",
          stateId: cdmx._id,
        }
      );
    }

    if (jalisco) {
      seedData.push(
        {
          name: "Guadalajara",
          stateId: jalisco._id,
        },
        {
          name: "Zapopan",
          stateId: jalisco._id,
        }
      );
    }

    if (yucatan) {
      seedData.push({
        name: "Mérida",
        stateId: yucatan._id,
      });
    }

    if (seedData.length > 0) {
      await this.create(seedData);
    }
  }
};

municipalitySchema.index(
  { name: 1, stateId: 1 },
  {
    unique: true,
    collation: { locale: "es", strength: 2 },
  }
);

const Municipality = mongoose.model("cc_municipality", municipalitySchema);

export { Municipality };
