import mongoose from 'mongoose';

const ImportedInvoicesSchema = new mongoose.Schema({
  // UUID del folio fiscal (identificador único del CFDI)
  uuid: {
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
    ref: 'cc_companies',
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

  // Importe a pagar (monto original de la factura)
  importeAPagar: {
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
  },

  // Folio del comprobante
  folio: {
    type: String,
    trim: true,
    maxLength: 50,
    index: true
  },

  // Serie del comprobante
  serie: {
    type: String,
    trim: true,
    maxLength: 50,
    index: true
  },

  // Forma de pago (código SAT)
  formaPago: {
    type: String,
    trim: true,
    maxLength: 10
  },

  // Método de pago (PUE, PPD, etc.)
  metodoPago: {
    type: String,
    trim: true,
    maxLength: 10
  },

  // Importe ya pagado
  importePagado: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0,
    default: 0,
    get: function (value) {
      return value ? parseFloat(value.toString()) : 0;
    }
  },

  // Estado del pago (null=Pendiente de autorización, 0=Pendiente, 1=Enviado a pago, 2=Pagado, 3=Registrado)
  estadoPago: {
    type: Number,
    enum: {
      values: [null, 0, 1, 2, 3],
      message: 'El estado de pago debe ser null (Pendiente de autorización), 0 (Pendiente), 1 (Enviado), 2 (Pagado), o 3 (Registrado)'
    },
    default: 0,
    index: true
  },

  // Si la factura está completa
  esCompleta: {
    type: Boolean,
    default: false
  },

  // Descripción del pago
  descripcionPago: {
    type: String,
    trim: true,
    maxLength: 500
  },

  // Si está autorizada
  autorizada: {
    type: Boolean,
    default: true
  },

  // Si el pago fue rechazado (no se puede volver a autorizar hasta que se vuelva a pagar)
  pagoRechazado: {
    type: Boolean,
    default: false
  },

  // Fecha de revisión
  fechaRevision: {
    type: Date,
    default: null,
    index: true
  },

  // Si está registrado (0 = No, 1 = Sí)
  registrado: {
    type: Number,
    enum: {
      values: [0, 1],
      message: 'El valor debe ser 0 (No) o 1 (Sí)'
    },
    default: 0
  },

  // Si está pagado (0 = No, 1 = Sí)
  pagado: {
    type: Number,
    enum: {
      values: [0, 1],
      message: 'El valor debe ser 0 (No) o 1 (Sí)'
    },
    default: 0
  },

  // Estatus de la factura (texto descriptivo)
  fiestatus: {
    type: String,
    trim: true,
    maxLength: 50,
    default: 'Activo'
  },

  // Si la factura está registrada en un paquete
  estaRegistrada: {
    type: Boolean,
    default: false
  },

  // Motivo del descuento
  motivoDescuento: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  },

  // Porcentaje de descuento aplicado
  descuento: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'cc_imported_invoices',

  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      if (ret.importeAPagar && typeof ret.importeAPagar.toString === 'function') {
        ret.importeAPagar = parseFloat(ret.importeAPagar.toString());
      }
      if (ret.importePagado && typeof ret.importePagado.toString === 'function') {
        ret.importePagado = parseFloat(ret.importePagado.toString());
      }
      return ret;
    }
  }
});

ImportedInvoicesSchema.index({ rfcReceptor: 1, estatus: 1, fechaEmision: -1 });

ImportedInvoicesSchema.index({ rfcReceptor: 1, nombreEmisor: 1 });

// Índices adicionales para los nuevos campos
ImportedInvoicesSchema.index({ folio: 1, serie: 1 });
ImportedInvoicesSchema.index({ estadoPago: 1, estatus: 1 });
ImportedInvoicesSchema.index({ fechaRevision: -1 });
ImportedInvoicesSchema.index({ autorizada: 1 });
ImportedInvoicesSchema.index({ pagoRechazado: 1 });

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

// Métodos virtuales actualizados
ImportedInvoicesSchema.virtual('estaPagada').get(function () {
  return this.estadoPago === 2;
});

ImportedInvoicesSchema.virtual('fueEnviadaAPago').get(function () {
  return this.estadoPago === 1;
});

ImportedInvoicesSchema.virtual('tieneSaldoPendiente').get(function () {
  return this.importeAPagar > this.importePagado;
});

ImportedInvoicesSchema.virtual('saldo').get(function () {
  return this.importeAPagar - this.importePagado;
});

ImportedInvoicesSchema.virtual('porcentajePagado').get(function () {
  if (this.importeAPagar <= 0) return 0;
  return Math.round((this.importePagado / this.importeAPagar) * 100);
});

ImportedInvoicesSchema.virtual('descripcionEstadoPago').get(function () {
  const estados = {
    null: 'Pendiente de autorización',
    0: 'Pendiente',
    1: 'Enviado a pago',
    2: 'Pagado',
    3: 'Registrado'
  };
  return estados[this.estadoPago] || 'Desconocido';
});

// Métodos de instancia actualizados
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

ImportedInvoicesSchema.methods.enviarAPago = function () {
  this.estadoPago = 1;
  return this.save();
};

ImportedInvoicesSchema.methods.marcarComoPagada = function (importePagado = null) {
  if (importePagado !== null) {
    this.importePagado = importePagado;
  } else {
    this.importePagado = this.importeAPagar;
  }
  this.estadoPago = 2;
  return this.save();
};

ImportedInvoicesSchema.methods.marcarComoRegistrada = function () {
  this.estadoPago = 3;
  return this.save();
};

ImportedInvoicesSchema.methods.registrarPagoParcial = function (importePagado) {
  this.importePagado = importePagado;
  if (this.importePagado >= this.importeAPagar) {
    this.estadoPago = 2; // Pagado
  } else {
    this.estadoPago = 1; // Enviado a pago (para pagos parciales)
  }
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

ImportedInvoicesSchema.statics.obtenerResumenPagos = async function (rfcReceptor) {
  if (!rfcReceptor) {
    throw new Error('El RFC del receptor es requerido para obtener el resumen de pagos.');
  }

  const consultaFiltro = { rfcReceptor: rfcReceptor.toUpperCase() };

  const promesaTotal = this.countDocuments(consultaFiltro);
  const promesaPagadas = this.countDocuments({ ...consultaFiltro, estadoPago: 2 });
  const promesaPendientes = this.countDocuments({ ...consultaFiltro, estadoPago: 0 });
  const promesaEnviadas = this.countDocuments({ ...consultaFiltro, estadoPago: 1 });
  const promesaRegistradas = this.countDocuments({ ...consultaFiltro, estadoPago: 3 });
  const promesaAutorizadas = this.countDocuments({ ...consultaFiltro, autorizada: true });

  const [totalFacturas, facturasPagadas, facturasPendientes, facturasEnviadas, facturasRegistradas, facturasAutorizadas] = await Promise.all([
    promesaTotal,
    promesaPagadas,
    promesaPendientes,
    promesaEnviadas,
    promesaRegistradas,
    promesaAutorizadas
  ]);

  return {
    totalFacturas,
    facturasPagadas,
    facturasPendientes,
    facturasEnviadas,
    facturasRegistradas,
    facturasAutorizadas,
  };
};

ImportedInvoicesSchema.statics.buscarPorFolioSerie = function (folio, serie) {
  return this.find({ folio, serie });
};

ImportedInvoicesSchema.statics.buscarFacturasPendientes = function (rfcReceptor) {
  return this.find({
    rfcReceptor: rfcReceptor.toUpperCase(),
    estadoPago: 0,
    estatus: 1
  });
};

ImportedInvoicesSchema.pre('save', function (next) {
  if (this.estatus === 0 && !this.fechaCancelacion) {
    this.fechaCancelacion = new Date();
  }

  if (this.estatus === 1 && this.fechaCancelacion) {
    this.fechaCancelacion = null;
  }

  // Establecer importeAPagar por defecto si no está definido
  if (this.importeAPagar === undefined || this.importeAPagar === null) {
    this.importeAPagar = 0;
  }

  // Establecer importePagado por defecto si no está definido
  if (this.importePagado === undefined || this.importePagado === null) {
    this.importePagado = 0;
  }

  // Validar que importePagado no exceda el importeAPagar
  if (this.importePagado > this.importeAPagar) {
    this.importePagado = this.importeAPagar;
  }

  // Actualizar estadoPago basado en importePagado
  if (this.importePagado >= this.importeAPagar && this.importeAPagar > 0) {
    this.estadoPago = 2; // Pagado
  } else if (this.estadoPago === 2 && this.importePagado < this.importeAPagar) {
    this.estadoPago = 0; // Volver a pendiente si se reduce el pago
  }

  next();
});

const ImportedInvoices = mongoose.model('cc_imported_invoices', ImportedInvoicesSchema);

export { ImportedInvoices };