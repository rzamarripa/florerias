import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la unidad es requerido'],
    unique: true,
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  abbreviation: {
    type: String,
    required: [true, 'La abreviatura es requerida'],
    trim: true,
    maxlength: [10, 'La abreviatura no puede exceder 10 caracteres']
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
unitSchema.index({ status: 1 });

export default mongoose.model('Unit', unitSchema);
