import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const dealerSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  apellidoPaterno: {
    type: String,
    required: [true, 'El apellido paterno es requerido'],
    trim: true,
    maxlength: [50, 'El apellido paterno no puede exceder 50 caracteres']
  },
  apellidoMaterno: {
    type: String,
    required: [true, 'El apellido materno es requerido'],
    trim: true,
    maxlength: [50, 'El apellido materno no puede exceder 50 caracteres']
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es requerida'],
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true,
    maxlength: [15, 'El teléfono no puede exceder 15 caracteres']
  },
  correo: {
    type: String,
    required: [true, 'El correo es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un correo válido']
  },
  usuario: {
    type: String,
    required: [true, 'El usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El usuario debe tener al menos 3 caracteres'],
    maxlength: [30, 'El usuario no puede exceder 30 caracteres']
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  foto: {
    type: String,
    default: null
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
dealerSchema.index({ correo: 1 });
dealerSchema.index({ usuario: 1 });
dealerSchema.index({ estatus: 1 });
dealerSchema.index({ nombre: 1, apellidoPaterno: 1 });

// Middleware para hashear la contraseña antes de guardar
dealerSchema.pre('save', async function(next) {
  if (!this.isModified('contrasena')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
dealerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

// Método para obtener el nombre completo
dealerSchema.methods.getFullName = function() {
  return `${this.nombre} ${this.apellidoPaterno} ${this.apellidoMaterno}`.trim();
};

// Virtual para el nombre completo
dealerSchema.virtual('nombreCompleto').get(function() {
  return this.getFullName();
});

// Transformar la salida JSON para ocultar la contraseña
dealerSchema.methods.toJSON = function() {
  const dealer = this.toObject();
  delete dealer.contrasena;
  return dealer;
};

export default mongoose.model('Dealer', dealerSchema);
