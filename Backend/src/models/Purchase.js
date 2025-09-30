import mongoose from "mongoose";
const { Schema } = mongoose;

const purchaseSchema = new Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    addressee: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    processStatus: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    processPayment: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    branch: {
      type: String,
      required: true,
      trim: true
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

// Indexes for search optimization
purchaseSchema.index({ number: 1 });
purchaseSchema.index({ date: -1 });
purchaseSchema.index({ processStatus: 1 });
purchaseSchema.index({ processPayment: 1 });
purchaseSchema.index({ branch: 1 });

// Method to get formatted total
purchaseSchema.methods.getFormattedTotal = function() {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(this.total);
};

// Method to check if purchase is completed
purchaseSchema.methods.isCompleted = function() {
  return this.processStatus === 'completed' && this.processPayment === 'paid';
};

const Purchase = mongoose.model("cc_purchases", purchaseSchema);
export { Purchase };