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
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "cc_department",
      required: true
    },
    department: {
      type: String,
      required: true
    },
    profile: {
      name: {
        type: String,
        required: true
      },
      lastName: {
        type: String,
        required: true
      },
      fullName: {
        type: String,
        required: true
      },
      path: {
        type: String,
        default: "",
      },
      estatus: {
        type: Boolean,
        default: true,
      },
      image: {
        data: Buffer,
        contentType: String
      },
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "ac_role",
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
  const profile = { ...this.profile };

  if (profile.image && profile.image.data) {
    const base64Image = `data:${profile.image.contentType
      };base64,${profile.image.data.toString("base64")}`;
    profile.image = base64Image;
  }

  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    phone: this.phone,
    profile: profile,
    role: this.role,
    createdAt: this.createdAt,
  };
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  if (user.profile && user.profile.image && user.profile.image.data) {
    const base64Image = `data:${user.profile.image.contentType
      };base64,${user.profile.image.data.toString("base64")}`;
    user.profile.image = base64Image;
  }

  return user;
};

const User = mongoose.model("cs_user", userSchema);
export { User };
