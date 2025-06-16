import mongoose from "mongoose";
const { Schema } = mongoose;

const roleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  modules: [
    {
      type: Schema.Types.ObjectId,
      ref: "ac_modules",
    },
  ],
  estatus: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

roleSchema.methods.getModulesByPage = async function () {
  await this.populate({
    path: "modules",
    populate: {
      path: "page",
      select: "name path",
    },
  });
  const modulesByPage = {};
  this.modules.forEach((module) => {
    const pageId = module.page._id.toString();
    if (!modulesByPage[pageId]) {
      modulesByPage[pageId] = {
        page: module.page,
        modules: [],
      };
    }
    modulesByPage[pageId].modules.push(module);
  });
  return modulesByPage;
};

const Role = mongoose.model("ac_role", roleSchema);
export { Role };
