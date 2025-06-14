import mongoose from "mongoose";
const { Schema } = mongoose;

const razonSocialSchema = new Schema({
  nombreComercial: {
    type: String,
    required: true,
  },
  razonSocial: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  estatus: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

razonSocialSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create([
      {
        nombreComercial: "Ejemplo S.A. de C.V.",
        razonSocial: "Ejemplo Sociedad Anónima de Capital Variable",
        direccion: "Calle Falsa 123, Ciudad, País",
        estatus: true,
      },
      {
        nombreComercial: "Comercializadora XYZ",
        razonSocial: "Comercializadora XYZ S. de R.L. de C.V.",
        direccion: "Av. Principal 456, Ciudad, País",
        estatus: true,
      },
    ]);
  }
};

const RazonSocial = mongoose.model("RazonSocial", razonSocialSchema);

export { RazonSocial };
