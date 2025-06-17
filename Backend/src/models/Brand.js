import mongoose from "mongoose";
const { Schema } = mongoose;

const brandSchema = new Schema({
  logo: {
    data: Buffer,
    contentType: String,
  },
  category: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
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

brandSchema.methods.getPublicProfile = function () {
  const brand = this.toObject();

  if (brand.logo && brand.logo.data) {
    const base64Image = `data:${
      brand.logo.contentType
    };base64,${brand.logo.data.toString("base64")}`;
    brand.logo = base64Image;
  }

  return brand;
};

brandSchema.methods.toJSON = function () {
  const brand = this.toObject();

  if (brand.logo && brand.logo.data) {
    const base64Image = `data:${
      brand.logo.contentType
    };base64,${brand.logo.data.toString("base64")}`;
    brand.logo = base64Image;
  }

  return brand;
};

brandSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create([
      {
        category: "Alimentación",
        name: "La Güerita",
        description:
          "Marca especializada en productos alimenticios tradicionales",
      },
      {
        category: "Tecnología",
        name: "TechBrand",
        description: "Soluciones tecnológicas innovadoras",
      },
    ]);
  }
};

const Brand = mongoose.model("cc_brand", brandSchema);

export { Brand };
