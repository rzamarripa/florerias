import Cashier from '../models/Cashier.js';
import bcrypt from 'bcryptjs';

// Obtener todos los cajeros con filtros y paginación
const getAllCashiers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      nombre,
      apellidoPaterno,
      usuario,
      correo,
      telefono,
      estatus
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (nombre) {
      filters.nombre = { $regex: nombre, $options: 'i' };
    }
    
    if (apellidoPaterno) {
      filters.apellidoPaterno = { $regex: apellidoPaterno, $options: 'i' };
    }
    
    if (usuario) {
      filters.usuario = { $regex: usuario, $options: 'i' };
    }
    
    if (correo) {
      filters.correo = { $regex: correo, $options: 'i' };
    }
    
    if (telefono) {
      filters.telefono = { $regex: telefono, $options: 'i' };
    }
    
    if (estatus !== undefined) {
      filters.estatus = estatus === 'true';
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener cajeros con paginación
    const cashiers = await Cashier.find(filters)
      .select('-contrasena')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Cashier.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: cashiers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener cajeros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un cajero por ID
const getCashierById = async (req, res) => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findById(id).select('-contrasena');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cashier
    });
  } catch (error) {
    console.error('Error al obtener cajero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo cajero
const createCashier = async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      direccion,
      telefono,
      correo,
      usuario,
      contrasena,
      foto,
      cajero = true,
      estatus = true
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellidoPaterno || !apellidoMaterno || !direccion || 
        !telefono || !correo || !usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser proporcionados'
      });
    }

    // Verificar si el correo ya existe
    const existingEmailCashier = await Cashier.findOne({ correo: correo.toLowerCase() });
    if (existingEmailCashier) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si el usuario ya existe
    const existingUserCashier = await Cashier.findOne({ usuario });
    if (existingUserCashier) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo cajero
    const newCashier = new Cashier({
      nombre: nombre.trim(),
      apellidoPaterno: apellidoPaterno.trim(),
      apellidoMaterno: apellidoMaterno.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      correo: correo.toLowerCase().trim(),
      usuario: usuario.trim(),
      contrasena,
      foto,
      cajero,
      estatus
    });

    const savedCashier = await newCashier.save();

    res.status(201).json({
      success: true,
      data: savedCashier,
      message: 'Cajero creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cajero:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está registrado`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un cajero
const updateCashier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      direccion,
      telefono,
      correo,
      usuario,
      contrasena,
      foto,
      cajero,
      estatus
    } = req.body;

    // Verificar si el cajero existe
    const existingCashier = await Cashier.findById(id);
    if (!existingCashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    // Verificar si el correo ya existe en otro cajero
    if (correo && correo !== existingCashier.correo) {
      const emailExists = await Cashier.findOne({ 
        correo: correo.toLowerCase(),
        _id: { $ne: id }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }
    }

    // Verificar si el usuario ya existe en otro cajero
    if (usuario && usuario !== existingCashier.usuario) {
      const userExists = await Cashier.findOne({ 
        usuario,
        _id: { $ne: id }
      });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre.trim();
    if (apellidoPaterno) updateData.apellidoPaterno = apellidoPaterno.trim();
    if (apellidoMaterno) updateData.apellidoMaterno = apellidoMaterno.trim();
    if (direccion) updateData.direccion = direccion.trim();
    if (telefono) updateData.telefono = telefono.trim();
    if (correo) updateData.correo = correo.toLowerCase().trim();
    if (usuario) updateData.usuario = usuario.trim();
    if (foto !== undefined) updateData.foto = foto;
    if (cajero !== undefined) updateData.cajero = cajero;
    if (estatus !== undefined) updateData.estatus = estatus;

    // Si se proporciona una nueva contraseña, hashearla
    if (contrasena && contrasena.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.contrasena = await bcrypt.hash(contrasena, salt);
    }

    const updatedCashier = await Cashier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.status(200).json({
      success: true,
      data: updatedCashier,
      message: 'Cajero actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cajero:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está registrado`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un cajero
const deleteCashier = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCashier = await Cashier.findByIdAndDelete(id);

    if (!deletedCashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cajero eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cajero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un cajero
const activateCashier = async (req, res) => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findByIdAndUpdate(
      id,
      { estatus: true },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cashier,
      message: 'Cajero activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar cajero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un cajero
const deactivateCashier = async (req, res) => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cashier,
      message: 'Cajero desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar cajero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllCashiers,
  getCashierById,
  createCashier,
  updateCashier,
  deleteCashier,
  activateCashier,
  deactivateCashier
};