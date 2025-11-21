import mongoose from 'mongoose';

const insumoSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  unidad: {
    type: String,
    required: true,
    trim: true
  },
  importeCosto: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  importeVenta: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  unidad: {
    type: String,
    required: [true, 'La unidad es requerida'],
    trim: true,
    enum: ['pieza', 'paquete']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  productCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_product_category',
    default: null
  },
  orden: {
    type: Number,
    default: 0,
    min: 0
  },
  imagen: {
    type: String,
    trim: true,
    default: ''
  },
  insumos: [insumoSchema],
  totalCosto: {
    type: Number,
    default: 0,
    min: 0
  },
  totalVenta: {
    type: Number,
    default: 0,
    min: 0
  },
  labour: {
    type: Number,
    default: 0,
    min: 0
  },
  estatus: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
productSchema.index({ nombre: 1 });
productSchema.index({ estatus: 1 });
productSchema.index({ orden: 1 });
productSchema.index({ productCategory: 1 });

// Middleware para calcular totales antes de guardar
productSchema.pre('save', function(next) {
  if (this.insumos && this.insumos.length > 0) {
    this.totalCosto = this.insumos.reduce((sum, insumo) => sum + (insumo.importeCosto || 0), 0);
    this.totalVenta = this.insumos.reduce((sum, insumo) => sum + (insumo.importeVenta || 0), 0);
  }
  next();
});

export default mongoose.model('Product', productSchema);
