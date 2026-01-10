import mongoose from 'mongoose';

const ecommerceConfigSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_company',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_branch',
    required: true
  },
  // Tab Encabezado
  header: {
    pageTitle: {
      type: String,
      maxlength: 100,
      default: ''
    },
    logoUrl: String,
    logoPath: String,
    topbar: [{
      name: {
        type: String,
        required: true,
        maxlength: 50
      },
      link: {
        type: String,
        required: true,
        maxlength: 200
      },
      order: {
        type: Number,
        default: 0
      }
    }]
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
      title: {
        type: String,
        maxlength: 100,
        default: ''
      },
      text: {
        type: String,
        maxlength: 300,
        default: ''
      },
      imageUrl: String,
      imagePath: String,
      button: {
        name: {
          type: String,
          maxlength: 50,
          default: 'Ver más'
        },
        link: {
          type: String,
          maxlength: 200,
          default: '#'
        }
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
    promotions: {
      enabled: {
        type: Boolean,
        default: true
      },
      items: [{
        name: {
          type: String,
          required: true,
          maxlength: 100
        },
        text: {
          type: String,
          maxlength: 200
        },
        expirationDate: {
          type: Date
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }]
    },
    productCatalog: {
      enabled: {
        type: Boolean,
        default: true
      },
      title: {
        type: String,
        default: 'Catálogo de productos'
      },
      showPrice: {
        type: Boolean,
        default: true
      },
      showStock: {
        type: Boolean,
        default: true
      },
      showAddToCart: {
        type: Boolean,
        default: true
      }
    }
  },
  // Campo para almacenar productos seleccionados del catálogo
  itemsStock: [{
    productId: {
      type: String,
      required: true
    },
    nombre: {
      type: String,
      required: true
    },
    descripcion: String,
    precio: {
      type: Number,
      required: true
    },
    precioEditado: Number,
    quantity: {
      type: Number,
      required: true
    },
    imagen: String,
    productCategory: {
      type: mongoose.Schema.Types.Mixed
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
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