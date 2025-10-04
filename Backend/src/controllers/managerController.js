import Manager from '../models/Manager.js';
import bcrypt from 'bcryptjs';

// Obtener todos los managers con filtros y paginación
const getAllManagers = async (req, res) => {
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

    // Obtener managers con paginación
    const managers = await Manager.find(filters)
      .select('-contrasena')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Manager.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: managers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener managers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un manager por ID
const getManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await Manager.findById(id).select('-contrasena');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: manager
    });
  } catch (error) {
    console.error('Error al obtener manager:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo manager
const createManager = async (req, res) => {
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
    const existingEmailManager = await Manager.findOne({ correo: correo.toLowerCase() });
    if (existingEmailManager) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si el usuario ya existe
    const existingUserManager = await Manager.findOne({ usuario });
    if (existingUserManager) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo manager
    const newManager = new Manager({
      nombre: nombre.trim(),
      apellidoPaterno: apellidoPaterno.trim(),
      apellidoMaterno: apellidoMaterno.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      correo: correo.toLowerCase().trim(),
      usuario: usuario.trim(),
      contrasena,
      estatus
    });

    const savedManager = await newManager.save();

    res.status(201).json({
      success: true,
      data: savedManager,
      message: 'Manager creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear manager:', error);

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

// Actualizar un manager
const updateManager = async (req, res) => {
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
      estatus
    } = req.body;

    // Verificar si el manager existe
    const existingManager = await Manager.findById(id);
    if (!existingManager) {
      return res.status(404).json({
        success: false,
        message: 'Manager no encontrado'
      });
    }

    // Verificar si el correo ya existe en otro manager
    if (correo && correo !== existingManager.correo) {
      const emailExists = await Manager.findOne({
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

    // Verificar si el usuario ya existe en otro manager
    if (usuario && usuario !== existingManager.usuario) {
      const userExists = await Manager.findOne({
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
    if (estatus !== undefined) updateData.estatus = estatus;

    // Si se proporciona una nueva contraseña, hashearla
    if (contrasena && contrasena.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.contrasena = await bcrypt.hash(contrasena, salt);
    }

    const updatedManager = await Manager.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.status(200).json({
      success: true,
      data: updatedManager,
      message: 'Manager actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar manager:', error);

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

// Eliminar un manager
const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedManager = await Manager.findByIdAndDelete(id);

    if (!deletedManager) {
      return res.status(404).json({
        success: false,
        message: 'Manager no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Manager eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar manager:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un manager
const activateManager = async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await Manager.findByIdAndUpdate(
      id,
      { estatus: true },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: manager,
      message: 'Manager activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar manager:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un manager
const deactivateManager = async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await Manager.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: manager,
      message: 'Manager desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar manager:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
  activateManager,
  deactivateManager
};
