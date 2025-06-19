import mongoose from "mongoose";
const { Schema } = mongoose;

const rsUserProviderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "cs_user",
    required: true,
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: "cc_provider",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

rsUserProviderSchema.index({ userId: 1, providerId: 1 }, { unique: true });

rsUserProviderSchema.statics.getProvidersByUser = async function (userId) {
  return this.find({ userId }).populate("providerId");
};

rsUserProviderSchema.statics.getUsersByProvider = async function (providerId) {
  return this.find({ providerId }).populate("userId");
};

rsUserProviderSchema.statics.createRelation = async function (
  userId,
  providerId
) {
  return this.create({ userId, providerId });
};

rsUserProviderSchema.statics.removeRelation = async function (
  userId,
  providerId
) {
  return this.deleteOne({ userId, providerId });
};

const RsUserProvider = mongoose.model("rs_user_provider", rsUserProviderSchema);

export { RsUserProvider };
