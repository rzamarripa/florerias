import Production from '../models/Production.js';
import bcrypt from 'bcryptjs';

// Obtener todo el personal de producción con filtros y paginación
const getAllProduction = async (req, res) => {
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

    // Obtener personal de producción con paginación
    const production = await Production.find(filters)
      .select('-contrasena')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Production.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: production,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener personal de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una persona de producción por ID
const getProductionById = async (req, res) => {
  try {
    const { id } = req.params;

    const production = await Production.findById(id).select('-contrasena');

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Personal de producción no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: production
    });
  } catch (error) {
    console.error('Error al obtener personal de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nuevo personal de producción
const createProduction = async (req, res) => {
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
    const existingEmailProduction = await Production.findOne({ correo: correo.toLowerCase() });
    if (existingEmailProduction) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si el usuario ya existe
    const existingUserProduction = await Production.findOne({ usuario });
    if (existingUserProduction) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo personal de producción
    const newProduction = new Production({
      nombre: nombre.trim(),
      apellidoPaterno: apellidoPaterno.trim(),
      apellidoMaterno: apellidoMaterno.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      correo: correo.toLowerCase().trim(),
      usuario: usuario.trim(),
      contrasena,
      foto,
      estatus
    });

    const savedProduction = await newProduction.save();

    res.status(201).json({
      success: true,
      data: savedProduction,
      message: 'Personal de producción creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear personal de producción:', error);
    
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

// Actualizar personal de producción
const updateProduction = async (req, res) => {
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
      estatus
    } = req.body;

    // Verificar si el personal de producción existe
    const existingProduction = await Production.findById(id);
    if (!existingProduction) {
      return res.status(404).json({
        success: false,
        message: 'Personal de producción no encontrado'
      });
    }

    // Verificar si el correo ya existe en otro registro
    if (correo && correo !== existingProduction.correo) {
      const emailExists = await Production.findOne({ 
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

    // Verificar si el usuario ya existe en otro registro
    if (usuario && usuario !== existingProduction.usuario) {
      const userExists = await Production.findOne({ 
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
    if (estatus !== undefined) updateData.estatus = estatus;

    // Si se proporciona una nueva contraseña, hashearla
    if (contrasena && contrasena.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.contrasena = await bcrypt.hash(contrasena, salt);
    }

    const updatedProduction = await Production.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.status(200).json({
      success: true,
      data: updatedProduction,
      message: 'Personal de producción actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar personal de producción:', error);
    
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

// Eliminar personal de producción
const deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduction = await Production.findByIdAndDelete(id);

    if (!deletedProduction) {
      return res.status(404).json({
        success: false,
        message: 'Personal de producción no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Personal de producción eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar personal de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar personal de producción
const activateProduction = async (req, res) => {
  try {
    const { id } = req.params;

    const production = await Production.findByIdAndUpdate(
      id,
      { estatus: true },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Personal de producción no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: production,
      message: 'Personal de producción activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar personal de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar personal de producción
const deactivateProduction = async (req, res) => {
  try {
    const { id } = req.params;

    const production = await Production.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Personal de producción no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: production,
      message: 'Personal de producción desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar personal de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllProduction,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  activateProduction,
  deactivateProduction
};