import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Role } from '../models/Roles.js';
import bcrypt from 'bcryptjs';

// Obtener todos los usuarios de producción (usuarios con rol Producción) con filtros y paginación
const getAllProductionUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      estatus,
      branchId
    } = req.query;

    // Buscar el rol de Producción (insensible a acentos)
    const productionRole = await Role.findOne({ name: /^Producci[oó]n$/i });
    if (!productionRole) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el rol de Producción. Por favor, créalo en la sección de roles.'
      });
    }

    // Construir filtros
    const filters = { role: productionRole._id };

    if (search) {
      filters.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.fullName': { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (estatus !== undefined) {
      filters['profile.estatus'] = estatus === 'true';
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener usuarios de producción con paginación
    let productionUsers = await User.find(filters)
      .select('-password')
      .populate('role', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Si se especifica branchId, filtrar solo usuarios de esa sucursal
    if (branchId) {
      const branch = await Branch.findById(branchId).select('employees');
      if (branch) {
        const employeeIds = branch.employees.map(id => id.toString());
        productionUsers = productionUsers.filter(user =>
          employeeIds.includes(user._id.toString())
        );
      } else {
        productionUsers = [];
      }
    }

    // Obtener la sucursal de cada usuario de producción
    const usersWithBranch = await Promise.all(
      productionUsers.map(async (user) => {
        const branch = await Branch.findOne({
          employees: user._id
        }).select('branchName branchCode companyId');

        return {
          ...user.toObject(),
          branch: branch || null
        };
      })
    );

    // Contar total de documentos
    const total = await User.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: usersWithBranch,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un usuario de producción por ID
const getProductionUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const productionUser = await User.findById(id)
      .select('-password')
      .populate('role', 'name description');

    if (!productionUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de producción no encontrado'
      });
    }

    // Obtener la sucursal del usuario
    const branch = await Branch.findOne({
      employees: productionUser._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...productionUser.toObject(),
        branch: branch || null
      }
    });
  } catch (error) {
    console.error('Error al obtener usuario de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función createProductionUser eliminada - Los usuarios de producción se crean desde el módulo de branches

// Actualizar un usuario de producción
const updateProductionUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      phone,
      password,
      profile,
      estatus
    } = req.body;

    // Verificar si el usuario existe
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de producción no encontrado'
      });
    }

    // Verificar si el username ya existe en otro usuario
    if (username && username !== existingUser.username) {
      const usernameExists = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        _id: { $ne: id }
      });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
    }

    // Verificar si el email ya existe en otro usuario
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') },
        _id: { $ne: id }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    if (profile) {
      updateData.profile = {
        ...existingUser.profile,
        ...(profile.name && { name: profile.name }),
        ...(profile.lastName && { lastName: profile.lastName }),
        ...(estatus !== undefined && { estatus })
      };

      // Actualizar fullName si name o lastName cambian
      if (profile.name || profile.lastName) {
        const newName = profile.name || existingUser.profile.name;
        const newLastName = profile.lastName || existingUser.profile.lastName;
        updateData.profile.fullName = `${newName} ${newLastName}`;
      }
    } else if (estatus !== undefined) {
      updateData.profile = {
        ...existingUser.profile,
        estatus
      };
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    // Obtener la sucursal del usuario
    const branch = await Branch.findOne({
      employees: updatedUser._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        branch: branch || null
      },
      message: 'Usuario de producción actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario de producción:', error);

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

// Eliminar un usuario de producción
const deleteProductionUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de producción no encontrado'
      });
    }

    // Remover el usuario del array employees de todas las sucursales
    await Branch.updateMany(
      { employees: id },
      { $pull: { employees: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Usuario de producción eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un usuario de producción
const activateProductionUser = async (req, res) => {
  try {
    const { id } = req.params;

    const productionUser = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': true },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!productionUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de producción no encontrado'
      });
    }

    // Obtener la sucursal del usuario
    const branch = await Branch.findOne({
      employees: productionUser._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...productionUser.toObject(),
        branch: branch || null
      },
      message: 'Usuario de producción activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar usuario de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un usuario de producción
const deactivateProductionUser = async (req, res) => {
  try {
    const { id } = req.params;

    const productionUser = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': false },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!productionUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de producción no encontrado'
      });
    }

    // Obtener la sucursal del usuario
    const branch = await Branch.findOne({
      employees: productionUser._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...productionUser.toObject(),
        branch: branch || null
      },
      message: 'Usuario de producción desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar usuario de producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllProductionUsers,
  getProductionUserById,
  updateProductionUser,
  deleteProductionUser,
  activateProductionUser,
  deactivateProductionUser
};