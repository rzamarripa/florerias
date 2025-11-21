import Manager from '../models/Manager.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Role } from '../models/Roles.js';
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
      estatus,
      branchId
    } = req.query;

    // Obtener el rol de Gerente
    const gerenteRole = await Role.findOne({ name: 'Gerente' });
    if (!gerenteRole) {
      return res.status(404).json({
        success: false,
        message: 'Rol de Gerente no encontrado'
      });
    }

    // Construir filtros
    const filters = {
      role: gerenteRole._id
    };

    if (nombre) {
      filters['profile.name'] = { $regex: nombre, $options: 'i' };
    }

    if (apellidoPaterno) {
      filters['profile.lastName'] = { $regex: apellidoPaterno, $options: 'i' };
    }

    if (usuario) {
      filters.username = { $regex: usuario, $options: 'i' };
    }

    if (correo) {
      filters.email = { $regex: correo, $options: 'i' };
    }

    if (telefono) {
      filters.phone = { $regex: telefono, $options: 'i' };
    }

    if (estatus !== undefined) {
      filters['profile.estatus'] = estatus === 'true';
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener managers con paginación
    const managers = await User.find(filters)
      .select('-password')
      .populate('role', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transformar datos al formato esperado por el frontend
    const transformedManagers = managers.map(manager => ({
      _id: manager._id,
      nombre: manager.profile.name,
      apellidoPaterno: manager.profile.lastName.split(' ')[0] || '',
      apellidoMaterno: manager.profile.lastName.split(' ')[1] || '',
      direccion: manager.profile.path || '',
      telefono: manager.phone,
      correo: manager.email,
      usuario: manager.username,
      foto: manager.profile.image || '',
      estatus: manager.profile.estatus,
      createdAt: manager.createdAt,
      updatedAt: manager.updatedAt
    }));

    // Contar total de documentos
    const total = await User.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: transformedManagers,
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
      estatus = true,
      branchId
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellidoPaterno || !apellidoMaterno || !direccion ||
        !telefono || !correo || !usuario || !contrasena || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser proporcionados, incluyendo la sucursal'
      });
    }

    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'La sucursal especificada no existe'
      });
    }

    // Obtener el rol de Gerente
    const gerenteRole = await Role.findOne({ name: 'Gerente' });
    if (!gerenteRole) {
      return res.status(404).json({
        success: false,
        message: 'Rol de Gerente no encontrado en el sistema'
      });
    }

    // Verificar si el correo ya existe
    const existingEmailUser = await User.findOne({ email: correo.toLowerCase() });
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si el usuario ya existe
    const existingUsername = await User.findOne({ username: usuario });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Crear nuevo usuario con rol de Gerente
    const fullName = `${nombre.trim()} ${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`;
    const newManager = new User({
      username: usuario.trim(),
      email: correo.toLowerCase().trim(),
      phone: telefono.trim(),
      password: contrasena,
      profile: {
        name: nombre.trim(),
        lastName: `${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`,
        fullName: fullName,
        path: direccion.trim(),
        estatus: estatus
      },
      role: gerenteRole._id
    });

    const savedManager = await newManager.save();

    // Actualizar la sucursal con el ID del gerente
    branch.manager = savedManager._id;
    await branch.save();

    // Obtener el manager con el rol poblado
    const managerWithRole = await User.findById(savedManager._id)
      .select('-password')
      .populate('role', 'name');

    // Transformar datos al formato esperado
    const transformedManager = {
      _id: managerWithRole._id,
      nombre: managerWithRole.profile.name,
      apellidoPaterno: managerWithRole.profile.lastName.split(' ')[0] || '',
      apellidoMaterno: managerWithRole.profile.lastName.split(' ')[1] || '',
      direccion: managerWithRole.profile.path || '',
      telefono: managerWithRole.phone,
      correo: managerWithRole.email,
      usuario: managerWithRole.username,
      foto: managerWithRole.profile.image || '',
      estatus: managerWithRole.profile.estatus,
      createdAt: managerWithRole.createdAt,
      updatedAt: managerWithRole.updatedAt
    };

    res.status(201).json({
      success: true,
      data: transformedManager,
      message: 'Gerente creado exitosamente y asignado a la sucursal'
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

    // Verificar si el manager existe en cs_users
    const existingManager = await User.findById(id);
    if (!existingManager) {
      return res.status(404).json({
        success: false,
        message: 'Gerente no encontrado'
      });
    }

    // Verificar si el correo ya existe en otro usuario
    if (correo && correo !== existingManager.email) {
      const emailExists = await User.findOne({
        email: correo.toLowerCase(),
        _id: { $ne: id }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }
    }

    // Verificar si el usuario ya existe en otro usuario
    if (usuario && usuario !== existingManager.username) {
      const userExists = await User.findOne({
        username: usuario,
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

    if (usuario) updateData.username = usuario.trim();
    if (correo) updateData.email = correo.toLowerCase().trim();
    if (telefono) updateData.phone = telefono.trim();

    // Actualizar profile
    if (nombre || apellidoPaterno || apellidoMaterno || direccion || estatus !== undefined) {
      updateData.profile = { ...existingManager.profile };

      if (nombre) updateData.profile.name = nombre.trim();
      if (apellidoPaterno || apellidoMaterno) {
        const newLastName = `${apellidoPaterno ? apellidoPaterno.trim() : existingManager.profile.lastName.split(' ')[0] || ''} ${apellidoMaterno ? apellidoMaterno.trim() : existingManager.profile.lastName.split(' ')[1] || ''}`.trim();
        updateData.profile.lastName = newLastName;
      }
      if (nombre || apellidoPaterno || apellidoMaterno) {
        const finalNombre = nombre ? nombre.trim() : existingManager.profile.name;
        const finalApellidoPaterno = apellidoPaterno ? apellidoPaterno.trim() : existingManager.profile.lastName.split(' ')[0] || '';
        const finalApellidoMaterno = apellidoMaterno ? apellidoMaterno.trim() : existingManager.profile.lastName.split(' ')[1] || '';
        updateData.profile.fullName = `${finalNombre} ${finalApellidoPaterno} ${finalApellidoMaterno}`.trim();
      }
      if (direccion) updateData.profile.path = direccion.trim();
      if (estatus !== undefined) updateData.profile.estatus = estatus;
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (contrasena && contrasena.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(contrasena, salt);
    }

    const updatedManager = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name');

    // Transformar datos al formato esperado
    const transformedManager = {
      _id: updatedManager._id,
      nombre: updatedManager.profile.name,
      apellidoPaterno: updatedManager.profile.lastName.split(' ')[0] || '',
      apellidoMaterno: updatedManager.profile.lastName.split(' ')[1] || '',
      direccion: updatedManager.profile.path || '',
      telefono: updatedManager.phone,
      correo: updatedManager.email,
      usuario: updatedManager.username,
      foto: updatedManager.profile.image || '',
      estatus: updatedManager.profile.estatus,
      createdAt: updatedManager.createdAt,
      updatedAt: updatedManager.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transformedManager,
      message: 'Gerente actualizado exitosamente'
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

    const manager = await User.findById(id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Gerente no encontrado'
      });
    }

    manager.profile.estatus = true;
    await manager.save();

    const updatedManager = await User.findById(id)
      .select('-password')
      .populate('role', 'name');

    // Transformar datos al formato esperado
    const transformedManager = {
      _id: updatedManager._id,
      nombre: updatedManager.profile.name,
      apellidoPaterno: updatedManager.profile.lastName.split(' ')[0] || '',
      apellidoMaterno: updatedManager.profile.lastName.split(' ')[1] || '',
      direccion: updatedManager.profile.path || '',
      telefono: updatedManager.phone,
      correo: updatedManager.email,
      usuario: updatedManager.username,
      foto: updatedManager.profile.image || '',
      estatus: updatedManager.profile.estatus,
      createdAt: updatedManager.createdAt,
      updatedAt: updatedManager.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transformedManager,
      message: 'Gerente activado exitosamente'
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

    const manager = await User.findById(id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Gerente no encontrado'
      });
    }

    manager.profile.estatus = false;
    await manager.save();

    const updatedManager = await User.findById(id)
      .select('-password')
      .populate('role', 'name');

    // Transformar datos al formato esperado
    const transformedManager = {
      _id: updatedManager._id,
      nombre: updatedManager.profile.name,
      apellidoPaterno: updatedManager.profile.lastName.split(' ')[0] || '',
      apellidoMaterno: updatedManager.profile.lastName.split(' ')[1] || '',
      direccion: updatedManager.profile.path || '',
      telefono: updatedManager.phone,
      correo: updatedManager.email,
      usuario: updatedManager.username,
      foto: updatedManager.profile.image || '',
      estatus: updatedManager.profile.estatus,
      createdAt: updatedManager.createdAt,
      updatedAt: updatedManager.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transformedManager,
      message: 'Gerente desactivado exitosamente'
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
