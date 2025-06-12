import bcrypt from "bcryptjs";
import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    department: String,
    profile: {
      nombre: String,
      nombreCompleto: String,
      path: {
        type: String,
        default: "",
      },
      estatus: {
        type: Boolean,
        default: true,
      },
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strictPopulate: false,
  }
);

userSchema.pre("save", async function (next) {
  console.log("Hook pre-save ejecutándose...");

  if (!this.isModified("password")) {
    console.log("Password no modificado, saltando hash");
    return next();
  }

  console.log("Hasheando password...", this.password);
  this.password = await bcrypt.hash(this.password, 12);
  console.log("Password hasheado:", this.password);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    username: this.username,
    profile: this.profile,
    role: this.role,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export { User };
