import mongoose from "mongoose";

const { Schema } = mongoose;

const userSessionLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El usuario es requerido"],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "La empresa es requerida"],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSessionLogSchema.index({ userId: 1 });
userSessionLogSchema.index({ companyId: 1 });
userSessionLogSchema.index({ isOpen: 1 });

export const UserSessionLog = mongoose.model(
  "user_session_log",
  userSessionLogSchema
);
