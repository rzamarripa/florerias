import mongoose from 'mongoose';

const ImportedInvoicesSchema = new mongoose.Schema({
  // UUID del folio fiscal (identificador único del CFDI)
  folioFiscalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i, 'Formato de UUID inválido'],
    index: true
  },

  // RFC del emisor de la factura
  rfcEmisor: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC inválido'],
  },

  // Razón social o nombre del emisor
  nombreEmisor: {
    type: String,
    required: true,
    trim: true,
    maxLength: 254
  },

  // Referencia a la empresa en el sistema
  razonSocial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cc_company',
    required: true,
    index: true
  },

  // RFC del receptor de la factura
  rfcReceptor: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC inválido'],
  },

  // Razón social o nombre del receptor
  nombreReceptor: {
    type: String,
    required: true,
    trim: true,
    maxLength: 254
  },

  // RFC del Proveedor Autorizado de Certificación (PAC)
  rfcProveedorCertificacion: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC del PAC inválido']
  },

  // Fecha de emisión del comprobante
  fechaEmision: {
    type: Date,
    required: true,
    index: true
  },

  // Fecha de timbrado/certificación por el SAT
  fechaCertificacionSAT: {
    type: Date,
    required: true,
    index: true
  },

  // Fecha de cancelación del comprobante
  fechaCancelacion: {
    type: Date,
    default: null,
    index: true
  },

  // Importe total del comprobante
  importe: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0,
    get: function (value) {
      return value ? parseFloat(value.toString()) : 0;
    }
  },

  // Tipo de comprobante fiscal
  tipoComprobante: {
    type: String,
    required: true,
    enum: {
      values: ['I', 'E', 'P'],
      message: 'El tipo de comprobante debe ser I (Ingreso), E (Egreso), o P (Pago)'
    },
    index: true
  },

  // Estatus del comprobante
  estatus: {
    type: Number,
    required: true,
    enum: {
      values: [0, 1],
      message: 'El estatus debe ser 0 (Cancelado) o 1 (Vigente)'
    },
    default: 1,
    index: true
  }
}, {
  timestamps: true,
  collection: 'cc_imported_invoices',

  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      if (ret.importe && typeof ret.importe.toString === 'function') {
        ret.importe = parseFloat(ret.importe.toString());
      }
      return ret;
    }
  }
});

ImportedInvoicesSchema.index({ rfcReceptor: 1, estatus: 1, fechaEmision: -1 });

ImportedInvoicesSchema.index({ rfcReceptor: 1, nombreEmisor: 1 });

ImportedInvoicesSchema.virtual('descripcionTipoComprobante').get(function () {
  const tipos = {
    'I': 'Ingreso',
    'E': 'Egreso',
    'P': 'Pago'
  };
  return tipos[this.tipoComprobante] || 'Desconocido';
});

ImportedInvoicesSchema.virtual('descripcionEstatus').get(function () {
  return this.estatus === 1 ? 'Vigente' : 'Cancelado';
});

ImportedInvoicesSchema.virtual('estaCancelado').get(function () {
  return this.estatus === 0;
});

ImportedInvoicesSchema.virtual('estaVigente').get(function () {
  return this.estatus === 1;
});

// Métodos de instancia
ImportedInvoicesSchema.methods.cancelar = function (fechaCancelacion = new Date()) {
  this.estatus = 0;
  this.fechaCancelacion = fechaCancelacion;
  return this.save();
};

ImportedInvoicesSchema.methods.reactivar = function () {
  this.estatus = 1;
  this.fechaCancelacion = null;
  return this.save();
};

// Métodos estáticos
ImportedInvoicesSchema.statics.buscarPorRFC = function (rfc, esEmisor = true) {
  const campo = esEmisor ? 'rfcEmisor' : 'rfcReceptor';
  return this.find({ [campo]: rfc.toUpperCase() });
};

ImportedInvoicesSchema.statics.buscarPorRangoFechas = function (fechaInicio, fechaFin) {
  return this.find({
    fechaEmision: {
      $gte: fechaInicio,
      $lte: fechaFin
    }
  });
};

ImportedInvoicesSchema.statics.obtenerResumen = async function (rfcReceptor) {
  if (!rfcReceptor) {
    throw new Error('El RFC del receptor es requerido para obtener el resumen.');
  }

  const consultaFiltro = { rfcReceptor: rfcReceptor.toUpperCase() };

  const promesaTotal = this.countDocuments(consultaFiltro);
  const promesaCanceladas = this.countDocuments({ ...consultaFiltro, estatus: 0 });
  const promesaProveedoresUnicos = this.distinct('nombreEmisor', consultaFiltro);

  const [totalFacturas, facturasCanceladas, proveedoresUnicos] = await Promise.all([
    promesaTotal,
    promesaCanceladas,
    promesaProveedoresUnicos
  ]);

  return {
    totalFacturas,
    facturasCanceladas,
    proveedoresUnicos: proveedoresUnicos.length,
  };
};

ImportedInvoicesSchema.pre('save', function (next) {
  if (this.estatus === 0 && !this.fechaCancelacion) {
    this.fechaCancelacion = new Date();
  }

  if (this.estatus === 1 && this.fechaCancelacion) {
    this.fechaCancelacion = null;
  }

  next();
});

const ImportedInvoices = mongoose.model('ImportedInvoices', ImportedInvoicesSchema);

export { ImportedInvoices };