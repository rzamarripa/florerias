import mongoose from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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

categorySchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create([
      {
        name: "Alimentación",
      },
      {
        name: "Tecnología",
      },
      {
        name: "Salud y Belleza",
      },
      {
        name: "Hogar y Decoración",
      },
      {
        name: "Moda y Accesorios",
      },
    ]);
  }
};

const Category = mongoose.model("cc_category", categorySchema);

export { Category };
