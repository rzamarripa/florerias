import mongoose from 'mongoose';

// Schema para los insumos embebidos dentro de cada producto
const embeddedInsumoSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Opcional porque productos antiguos pueden no tenerlo
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

// Schema para el producto embebido completo
const embeddedProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  unidad: {
    type: String,
    required: true,
    trim: true,
    enum: ['pieza', 'paquete']
  },
  descripcion: {
    type: String,
    trim: true
  },
  orden: {
    type: Number,
    default: 0
  },
  imagen: {
    type: String,
    trim: true,
    default: ''
  },
  insumos: [embeddedInsumoSchema],
  cantidad: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
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
  },
  productCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_product_category',
    default: null
  }
}, { _id: false });

const productListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product list name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  products: {
    type: [embeddedProductSchema],
    default: []
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_company',
    required: [true, 'Company is required']
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_branch',
    required: [true, 'Branch is required']
  },
  expirationDate: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'product_lists'
});

// Índices
productListSchema.index({ company: 1, status: 1 });
productListSchema.index({ branch: 1, status: 1 });
productListSchema.index({ expirationDate: 1 });
productListSchema.index({ createdAt: -1 });

// Permitir múltiples listas por sucursal (sin índice único)

const ProductList = mongoose.model('ProductList', productListSchema);

export default ProductList;
