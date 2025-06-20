import mongoose from 'mongoose';

const ImportedInvoicesSchema = new mongoose.Schema({
  fiscalFolioId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i, 'Invalid UUID format'],
    index: true
  },

  issuerTaxId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Invalid RFC format'],
  },

  issuerName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 254
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cc_company',
    required: true,
    index: true
  },

  receiverTaxId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Invalid RFC format'],
  },

  receiverName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 254
  },

  certificationProviderId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Invalid PAC RFC format']
  },

  issuanceDate: {
    type: Date,
    required: true,
    index: true
  },

  taxAuthorityCertificationDate: {
    type: Date,
    required: true,
    index: true
  },

  cancellationDate: {
    type: Date,
    default: null,
    index: true
  },

  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0,
    get: function(value) {
      return value ? parseFloat(value.toString()) : 0;
    }
  },

  voucherType: {
    type: String,
    required: true,
    enum: {
      values: ['I', 'E', 'P'],
      message: 'Voucher type must be I (Income), E (Expense), or P (Payment)'
    },
    index: true
  },

  status: {
    type: Number,
    required: true,
    enum: {
      values: [0, 1],
      message: 'Status must be 0 (Cancelled) or 1 (Active)'
    },
    default: 1,
    index: true
  }
}, {
  timestamps: true,
  collection: 'cc_imported_invoices',
  
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.amount && typeof ret.amount.toString === 'function') {
        ret.amount = parseFloat(ret.amount.toString());
      }
      return ret;
    }
  }
});

// Indexes for query optimization
// 1. Ensures each invoice is unique and speeds up the upsert process.
// The `unique: true` option on fiscalFolioId already creates this index.

// 2. Optimizes fetching and sorting invoices for a specific company, 
// which is the main view in the frontend. Also helps with counting totals.
ImportedInvoicesSchema.index({ receiverTaxId: 1, status: 1, issuanceDate: -1 });

// 3. Optimizes counting unique providers for the summary cards.
ImportedInvoicesSchema.index({ receiverTaxId: 1, issuerName: 1 });

ImportedInvoicesSchema.virtual('voucherTypeDescription').get(function() {
  const types = {
    'I': 'Income',
    'E': 'Expense', 
    'P': 'Payment'
  };
  return types[this.voucherType] || 'Unknown';
});

ImportedInvoicesSchema.virtual('statusDescription').get(function() {
  return this.status === 1 ? 'Active' : 'Cancelled';
});

ImportedInvoicesSchema.virtual('isCancelled').get(function() {
  return this.status === 0;
});

ImportedInvoicesSchema.virtual('isActive').get(function() {
  return this.status === 1;
});

ImportedInvoicesSchema.methods.cancel = function(cancellationDate = new Date()) {
  this.status = 0;
  this.cancellationDate = cancellationDate;
  return this.save();
};

ImportedInvoicesSchema.methods.reactivate = function() {
  this.status = 1;
  this.cancellationDate = null;
  return this.save();
};

ImportedInvoicesSchema.statics.findByTaxId = function(taxId, isIssuer = true) {
  const field = isIssuer ? 'issuerTaxId' : 'receiverTaxId';
  return this.find({ [field]: taxId.toUpperCase() });
};

ImportedInvoicesSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    issuanceDate: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

ImportedInvoicesSchema.statics.getSummary = async function(receiverTaxId) {
  if (!receiverTaxId) {
    throw new Error('receiverTaxId is required to get a summary.');
  }

  const matchQuery = { receiverTaxId: receiverTaxId.toUpperCase() };

  const totalPromise = this.countDocuments(matchQuery);
  const cancelledPromise = this.countDocuments({ ...matchQuery, status: 0 });
  const uniqueProvidersPromise = this.distinct('issuerName', matchQuery);

  const [totalInvoices, cancelledInvoices, uniqueProviders] = await Promise.all([
    totalPromise,
    cancelledPromise,
    uniqueProvidersPromise
  ]);

  return {
    totalInvoices,
    cancelledInvoices,
    uniqueProviders: uniqueProviders.length,
  };
};

ImportedInvoicesSchema.statics.getTotalByVoucherType = function(voucherType, taxId = null) {
  const match = { voucherType, status: 1 };
  if (taxId) {
    match.$or = [
      { issuerTaxId: taxId.toUpperCase() },
      { receiverTaxId: taxId.toUpperCase() }
    ];
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { 
          $sum: { $toDouble: '$amount' }
        },
        count: { $sum: 1 }
      }
    }
  ]);
};

ImportedInvoicesSchema.pre('save', function(next) {
  if (this.status === 0 && !this.cancellationDate) {
    this.cancellationDate = new Date();
  }
  
  if (this.status === 1 && this.cancellationDate) {
    this.cancellationDate = null;
  }
  
  next();
});

const ImportedInvoices = mongoose.model('ImportedInvoices', ImportedInvoicesSchema);

export { ImportedInvoices };