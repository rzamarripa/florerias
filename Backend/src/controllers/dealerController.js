import Dealer from '../models/Dealer.js';
import bcrypt from 'bcryptjs';

// Obtener todos los dealers con filtros y paginación
const getAllDealers = async (req, res) => {
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

    // Obtener dealers con paginación
    const dealers = await Dealer.find(filters)
      .select('-contrasena')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Dealer.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: dealers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener dealers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un dealer por ID
const getDealerById = async (req, res) => {
  try {
    const { id } = req.params;

    const dealer = await Dealer.findById(id).select('-contrasena');

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: dealer
    });
  } catch (error) {
    console.error('Error al obtener dealer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo dealer
const createDealer = async (req, res) => {
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
    const existingEmailDealer = await Dealer.findOne({ correo: correo.toLowerCase() });
    if (existingEmailDealer) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si el usuario ya existe
    const existingUserDealer = await Dealer.findOne({ usuario });
    if (existingUserDealer) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo dealer
    const newDealer = new Dealer({
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

    const savedDealer = await newDealer.save();

    res.status(201).json({
      success: true,
      data: savedDealer,
      message: 'Dealer creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear dealer:', error);

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

// Actualizar un dealer
const updateDealer = async (req, res) => {
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

    // Verificar si el dealer existe
    const existingDealer = await Dealer.findById(id);
    if (!existingDealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer no encontrado'
      });
    }

    // Verificar si el correo ya existe en otro dealer
    if (correo && correo !== existingDealer.correo) {
      const emailExists = await Dealer.findOne({
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

    // Verificar si el usuario ya existe en otro dealer
    if (usuario && usuario !== existingDealer.usuario) {
      const userExists = await Dealer.findOne({
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

    const updatedDealer = await Dealer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.status(200).json({
      success: true,
      data: updatedDealer,
      message: 'Dealer actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar dealer:', error);

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

// Eliminar un dealer
const deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDealer = await Dealer.findByIdAndDelete(id);

    if (!deletedDealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dealer eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar dealer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un dealer
const activateDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const dealer = await Dealer.findByIdAndUpdate(
      id,
      { estatus: true },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: dealer,
      message: 'Dealer activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar dealer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un dealer
const deactivateDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const dealer = await Dealer.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true, runValidators: true }
    ).select('-contrasena');

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: dealer,
      message: 'Dealer desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar dealer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllDealers,
  getDealerById,
  createDealer,
  updateDealer,
  deleteDealer,
  activateDealer,
  deactivateDealer
};
