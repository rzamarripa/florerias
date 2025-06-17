import mongoose from "mongoose";
const { Schema } = mongoose;

const pageSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Page name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      required: [true, "Page path is required"],
      unique: true,
      trim: true,
    },
    modules: [
      {
        type: Schema.Types.ObjectId,
        ref: "ac_module",
      },
    ],
    status: {
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
  },
  {
    strictPopulate: false,
  }
);

pageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

pageSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

pageSchema.methods.getActiveModules = async function () {
  await this.populate({
    path: "ac_module",
    match: { status: true },
  });
  return this.modules;
};

pageSchema.methods.addModule = function (moduleId) {
  if (!this.modules.includes(moduleId)) {
    this.modules.push(moduleId);
  }
  return this.save();
};

pageSchema.methods.removeModule = function (moduleId) {
  this.modules = this.modules.filter(
    (id) => id.toString() !== moduleId.toString()
  );
  return this.save();
};

const Page = mongoose.model("ac_page", pageSchema);
export { Page };
