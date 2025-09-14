import mongoose from "mongoose";
const { Schema } = mongoose;

const bankLayoutSchema = new Schema({
  fechaLayout: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  layoutFolio: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const randomDigits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      
      return `LYT_${day}${month}${year}${hours}${minutes}${randomDigits}`;
    }
  },
  tipoLayout: {
    type: String,
    required: true,
    enum: {
      values: ['grouped', 'individual'],
      message: 'El tipo de layout debe ser "grouped" o "individual"'
    },
    index: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'cc_companies',
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyRfc: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  bankAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: true,
    index: true
  },
  bankAccountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  packageIds: [{
    type: Schema.Types.ObjectId,
    ref: 'cc_invoices_package',
    required: true
  }],
  // Para layouts agrupados - referencias a PaymentsByProvider
  agrupaciones: [{
    type: Schema.Types.ObjectId,
    ref: 'cc_payments_by_provider'
  }],
  // Para layouts individuales - referencias directas a facturas
  facturasIndividuales: [{
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'cc_imported_invoices'
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'cc_invoices_package'
    },
    uuid: {
      type: String,
      trim: true
    },
    rfcEmisor: {
      type: String,
      trim: true,
      uppercase: true
    },
    nombreEmisor: {
      type: String,
      trim: true
    },
    importe: {
      type: Number,
      default: 0
    },
    referencia: {
      type: String,
      trim: true
    },
    folio: {
      type: String,
      trim: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalRegistros: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalPackages: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  archivoGenerado: {
    type: String,
    trim: true
  },
  observaciones: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  usuarioCreador: {
    type: Schema.Types.ObjectId,
    ref: 'cs_user',
    required: false
  },
  estatus: {
    type: String,
    required: true,
    enum: {
      values: ['Generado', 'Procesado', 'Conciliado', 'Cancelado'],
      message: 'El estatus debe ser Generado, Procesado, Conciliado o Cancelado'
    },
    default: 'Generado',
    index: true
  },
  metadatos: {
    registrosExcel: {
      type: Number,
      default: 0
    },
    tiempoProcesamiento: {
      type: Number,
      default: 0
    },
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true,
  collection: 'cc_bank_layouts'
});

// Índices
bankLayoutSchema.index({ companyId: 1, fechaLayout: -1 });
bankLayoutSchema.index({ bankAccountId: 1, fechaLayout: -1 });
bankLayoutSchema.index({ tipoLayout: 1, estatus: 1, fechaLayout: -1 });

// Virtuales
bankLayoutSchema.virtual('descripcionTipo').get(function () {
  return this.tipoLayout === 'grouped' ? 'Agrupado por Proveedor' : 'Facturas Individuales';
});

bankLayoutSchema.virtual('totalAgrupaciones').get(function () {
  return this.tipoLayout === 'grouped' ? this.agrupaciones.length : 0;
});

bankLayoutSchema.virtual('totalFacturasIndividuales').get(function () {
  return this.tipoLayout === 'individual' ? this.facturasIndividuales.length : 0;
});

// Métodos
bankLayoutSchema.methods.cambiarEstatus = function(nuevoEstatus, observaciones = null) {
  this.estatus = nuevoEstatus;
  if (observaciones) {
    this.observaciones = observaciones;
  }
  return this.save();
};

// Pre-save middleware
bankLayoutSchema.pre('save', function(next) {
  if (this.packageIds && this.packageIds.length > 0) {
    this.totalPackages = this.packageIds.length;
  }
  
  // Calcular totalRegistros según el tipo de layout
  if (this.tipoLayout === 'grouped') {
    this.totalRegistros = this.agrupaciones.length;
  } else if (this.tipoLayout === 'individual') {
    this.totalRegistros = this.facturasIndividuales.length;
  }
  
  next();
});

const BankLayout = mongoose.model("cc_bank_layouts", bankLayoutSchema);

export { BankLayout };