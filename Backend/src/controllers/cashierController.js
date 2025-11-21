import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Role } from '../models/Roles.js';
import bcrypt from 'bcryptjs';

// Obtener todos los cajeros (usuarios con rol Cajero) con filtros y paginación
const getAllCashiers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      estatus,
      branchId
    } = req.query;

    // Buscar el rol de Cajero
    const cajeroRole = await Role.findOne({ name: /^Cajero$/i });
    if (!cajeroRole) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el rol de Cajero'
      });
    }

    // Construir filtros
    const filters = { role: cajeroRole._id };

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

    // Obtener cajeros con paginación
    let cashiers = await User.find(filters)
      .select('-password')
      .populate('role', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Si se especifica branchId, filtrar solo cajeros de esa sucursal
    if (branchId) {
      const branch = await Branch.findById(branchId).select('employees');
      if (branch) {
        const employeeIds = branch.employees.map(id => id.toString());
        cashiers = cashiers.filter(cashier =>
          employeeIds.includes(cashier._id.toString())
        );
      } else {
        cashiers = [];
      }
    }

    // Obtener la sucursal de cada cajero
    const cashiersWithBranch = await Promise.all(
      cashiers.map(async (cashier) => {
        const branch = await Branch.findOne({
          employees: cashier._id
        }).select('branchName branchCode companyId');

        return {
          ...cashier.toObject(),
          branch: branch || null
        };
      })
    );

    // Contar total de documentos
    const total = await User.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: cashiersWithBranch,
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

    const cashier = await User.findById(id)
      .select('-password')
      .populate('role', 'name description');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    // Obtener la sucursal del cajero
    const branch = await Branch.findOne({
      employees: cashier._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...cashier.toObject(),
        branch: branch || null
      }
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
      username,
      email,
      phone,
      password,
      profile,
      branch
    } = req.body;

    // Validar campos requeridos
    if (!username || !email || !phone || !password || !profile || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser proporcionados'
      });
    }

    if (!profile.name || !profile.lastName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y apellido son requeridos'
      });
    }

    // Buscar el rol de Cajero
    const cajeroRole = await Role.findOne({ name: /^Cajero$/i });
    if (!cajeroRole) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró el rol de Cajero'
      });
    }

    // Verificar que la sucursal existe
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({
        success: false,
        message: 'La sucursal especificada no existe'
      });
    }

    // Verificar si el username ya existe
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Crear nuevo cajero en cs_user
    const newCashier = await User.create({
      username,
      email,
      phone,
      password,
      profile: {
        name: profile.name,
        lastName: profile.lastName,
        fullName: `${profile.name} ${profile.lastName}`,
        estatus: true
      },
      role: cajeroRole._id
    });

    // Agregar el cajero al array employees de la sucursal
    await Branch.findByIdAndUpdate(
      branch,
      { $addToSet: { employees: newCashier._id } },
      { new: true }
    );

    // Obtener el cajero con datos completos
    const populatedCashier = await User.findById(newCashier._id)
      .select('-password')
      .populate('role', 'name description');

    const branchData = await Branch.findById(branch)
      .select('branchName branchCode companyId');

    res.status(201).json({
      success: true,
      data: {
        ...populatedCashier.toObject(),
        branch: branchData
      },
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
      username,
      email,
      phone,
      password,
      profile,
      estatus
    } = req.body;

    // Verificar si el cajero existe
    const existingCashier = await User.findById(id);
    if (!existingCashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    // Verificar si el username ya existe en otro usuario
    if (username && username !== existingCashier.username) {
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
    if (email && email !== existingCashier.email) {
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
        ...existingCashier.profile,
        ...(profile.name && { name: profile.name }),
        ...(profile.lastName && { lastName: profile.lastName }),
        ...(estatus !== undefined && { estatus })
      };

      // Actualizar fullName si name o lastName cambian
      if (profile.name || profile.lastName) {
        const newName = profile.name || existingCashier.profile.name;
        const newLastName = profile.lastName || existingCashier.profile.lastName;
        updateData.profile.fullName = `${newName} ${newLastName}`;
      }
    } else if (estatus !== undefined) {
      updateData.profile = {
        ...existingCashier.profile,
        estatus
      };
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedCashier = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    // Obtener la sucursal del cajero
    const branch = await Branch.findOne({
      employees: updatedCashier._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...updatedCashier.toObject(),
        branch: branch || null
      },
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

    const deletedCashier = await User.findByIdAndDelete(id);

    if (!deletedCashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    // Remover el cajero del array employees de todas las sucursales
    await Branch.updateMany(
      { employees: id },
      { $pull: { employees: id } }
    );

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

    const cashier = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': true },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    // Obtener la sucursal del cajero
    const branch = await Branch.findOne({
      employees: cashier._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...cashier.toObject(),
        branch: branch || null
      },
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

    const cashier = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': false },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: 'Cajero no encontrado'
      });
    }

    // Obtener la sucursal del cajero
    const branch = await Branch.findOne({
      employees: cashier._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...cashier.toObject(),
        branch: branch || null
      },
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
