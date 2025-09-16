import mongoose from 'mongoose';

const BlackListProvidersSchema = new mongoose.Schema({
  rfc: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  situacion: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  numeroFechaOficioGlobalPresuncion: {
    type: String,
    required: true,
    trim: true,
    maxLength: 300
  },
  publicacionPaginaSATPresuntos: {
    type: Date,
    required: true,
    index: true
  },
  publicacionDOFPresuntos: {
    type: Date,
    required: true,
    index: true
  },
  publicacionPaginaSATDesvirtuados: {
    type: Date,
    default: null,
    index: true
  },
  numeroFechaOficioGlobalDesvirtuados: {
    type: String,
    trim: true,
    maxLength: 300,
    default: null
  },
  publicacionDOFDesvirtuados: {
    type: Date,
    default: null,
    index: true
  },
  numeroFechaOficioGlobalDefinitivos: {
    type: String,
    trim: true,
    maxLength: 300,
    default: null
  },
  publicacionPaginaSATDefinitivos: {
    type: Date,
    default: null,
    index: true
  },
  publicacionDOFDefinitivos: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  collection: 'cc_black_list_providers'
});

// Índices compuestos para mejorar las consultas
BlackListProvidersSchema.index({ rfc: 1, situacion: 1 });
BlackListProvidersSchema.index({ nombre: 1 });
BlackListProvidersSchema.index({ publicacionPaginaSATPresuntos: -1 });

// Método estático para buscar por RFC
BlackListProvidersSchema.statics.buscarPorRFC = function(rfc) {
  return this.findOne({ rfc: rfc.toUpperCase() });
};

// Método estático para buscar por situación
BlackListProvidersSchema.statics.buscarPorSituacion = function(situacion) {
  return this.find({ situacion: situacion });
};

// Método estático para buscar activos (presuntos sin desvirtuar)
BlackListProvidersSchema.statics.buscarActivos = function() {
  return this.find({
    publicacionPaginaSATDesvirtuados: null,
    publicacionPaginaSATDefinitivos: null
  });
};

const BlackListProviders = mongoose.model('cc_black_list_providers', BlackListProvidersSchema);

export { BlackListProviders };