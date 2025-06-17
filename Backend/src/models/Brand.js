import mongoose from "mongoose";
const { Schema } = mongoose;

const brandSchema = new Schema({
  logo: {
    data: Buffer,
    contentType: String,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "cc_category",
    required: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
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
    // Importar Category para obtener las categorías existentes
    const { Category } = await import("./Category.js");

    const alimentacionCategory = await Category.findOne({
      name: "Alimentación",
    });
    const tecnologiaCategory = await Category.findOne({ name: "Tecnología" });

    const seedData = [];

    if (alimentacionCategory) {
      seedData.push({
        categoryId: alimentacionCategory._id,
        name: "La Güerita",
        description:
          "Marca especializada en productos alimenticios tradicionales",
      });
    }

    if (tecnologiaCategory) {
      seedData.push({
        categoryId: tecnologiaCategory._id,
        name: "TechBrand",
        description: "Soluciones tecnológicas innovadoras",
      });
    }

    if (seedData.length > 0) {
      await this.create(seedData);
    }
  }
};

const Brand = mongoose.model("cc_brand", brandSchema);

export { Brand };
