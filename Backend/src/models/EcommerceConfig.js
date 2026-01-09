import mongoose from 'mongoose';

const ecommerceConfigSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  // Tab Encabezado
  header: {
    businessName: {
      type: String,
      maxlength: 50
    },
    logoUrl: String,
    logoPath: String,
    coverUrl: String,
    coverPath: String
  },
  // Tab Plantillas
  template: {
    type: String,
    enum: ['classic', 'modern', 'minimalist', 'elegant'],
    default: 'modern'
  },
  // Tab Colores
  colors: {
    primary: {
      type: String,
      default: '#6366f1'
    },
    secondary: {
      type: String,
      default: '#10b981'
    },
    background: {
      type: String,
      default: '#ffffff'
    },
    text: {
      type: String,
      default: '#1f2937'
    }
  },
  // Tab Tipografías
  typography: {
    titleFont: {
      type: String,
      default: 'Inter'
    },
    titleSize: {
      type: Number,
      default: 36,
      min: 24,
      max: 48
    },
    textFont: {
      type: String,
      default: 'Inter'
    },
    subtitleSize: {
      type: Number,
      default: 24,
      min: 18,
      max: 32
    },
    normalSize: {
      type: Number,
      default: 16,
      min: 12,
      max: 20
    }
  },
  // Tab Elementos Destacados
  featuredElements: {
    banner: {
      enabled: {
        type: Boolean,
        default: true
      },
      imageUrl: String,
      imagePath: String,
      buttonText: {
        type: String,
        default: 'Ver ofertas'
      }
    },
    carousel: {
      enabled: {
        type: Boolean,
        default: true
      },
      images: [{
        url: String,
        path: String
      }]
    },
    deliveryData: {
      pickup: {
        enabled: {
          type: Boolean,
          default: true
        },
        deliveryTime: {
          type: String,
          default: '30 minutos'
        },
        availableFrom: {
          type: String,
          default: '09:00'
        },
        availableTo: {
          type: String,
          default: '21:00'
        }
      },
      delivery: {
        enabled: {
          type: Boolean,
          default: true
        },
        deliveryTime: {
          type: String,
          default: '45 minutos'
        },
        availableFrom: {
          type: String,
          default: '09:00'
        },
        availableTo: {
          type: String,
          default: '21:00'
        }
      }
    },
    featuredProducts: {
      enabled: {
        type: Boolean,
        default: true
      },
      title: {
        type: String,
        default: 'Productos destacados'
      },
      quantity: {
        type: Number,
        default: 8,
        min: 4,
        max: 12
      }
    },
    promotions: {
      enabled: {
        type: Boolean,
        default: true
      },
      quantity: {
        type: Number,
        default: 4,
        min: 3,
        max: 8
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'ec_ecommerce_config'
});

// Índice único para evitar duplicados por sucursal
ecommerceConfigSchema.index({ branchId: 1 }, { unique: true });
ecommerceConfigSchema.index({ companyId: 1, branchId: 1 });

const EcommerceConfig = mongoose.model('EcommerceConfig', ecommerceConfigSchema);

export default EcommerceConfig;