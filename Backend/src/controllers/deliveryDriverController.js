import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Role } from '../models/Roles.js';
import bcrypt from 'bcryptjs';

// Obtener todos los repartidores (usuarios con rol Repartidor) con filtros y paginación
const getAllDeliveryDrivers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      estatus,
      branchId
    } = req.query;

    // Buscar el rol de Repartidor
    const deliveryRole = await Role.findOne({ name: /^Repartidor$/i });
    if (!deliveryRole) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el rol de Repartidor. Por favor, créalo en la sección de roles.'
      });
    }

    // Construir filtros
    const filters = { role: deliveryRole._id };

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

    // Obtener repartidores con paginación
    let deliveryDrivers = await User.find(filters)
      .select('-password')
      .populate('role', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Si se especifica branchId, filtrar solo repartidores de esa sucursal
    if (branchId) {
      const branch = await Branch.findById(branchId).select('employees');
      if (branch) {
        const employeeIds = branch.employees.map(id => id.toString());
        deliveryDrivers = deliveryDrivers.filter(driver =>
          employeeIds.includes(driver._id.toString())
        );
      } else {
        deliveryDrivers = [];
      }
    }

    // Obtener la sucursal de cada repartidor
    const driversWithBranch = await Promise.all(
      deliveryDrivers.map(async (driver) => {
        const branch = await Branch.findOne({
          employees: driver._id
        }).select('branchName branchCode companyId');

        return {
          ...driver.toObject(),
          branch: branch || null
        };
      })
    );

    // Contar total de documentos
    const total = await User.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: driversWithBranch,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un repartidor por ID
const getDeliveryDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryDriver = await User.findById(id)
      .select('-password')
      .populate('role', 'name description');

    if (!deliveryDriver) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado'
      });
    }

    // Obtener la sucursal del repartidor
    const branch = await Branch.findOne({
      employees: deliveryDriver._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...deliveryDriver.toObject(),
        branch: branch || null
      }
    });
  } catch (error) {
    console.error('Error al obtener repartidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo repartidor
const createDeliveryDriver = async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      profile,
      branch: branchId
    } = req.body;

    // Validaciones básicas
    if (!username || !email || !phone || !password || !profile?.name || !profile?.lastName || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Buscar el rol de Repartidor
    const deliveryRole = await Role.findOne({ name: /^Repartidor$/i });
    if (!deliveryRole) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el rol de Repartidor'
      });
    }

    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    // Verificar si el username ya existe
    const usernameExists = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar si el email ya existe
    const emailExists = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el nuevo repartidor
    const newDriver = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      profile: {
        name: profile.name,
        lastName: profile.lastName,
        fullName: `${profile.name} ${profile.lastName}`,
        estatus: true
      },
      role: deliveryRole._id
    });

    await newDriver.save();

    // Agregar el repartidor a la sucursal
    branch.employees.push(newDriver._id);
    await branch.save();

    // Obtener el repartidor creado con populate
    const createdDriver = await User.findById(newDriver._id)
      .select('-password')
      .populate('role', 'name description');

    res.status(201).json({
      success: true,
      data: {
        ...createdDriver.toObject(),
        branch: {
          _id: branch._id,
          branchName: branch.branchName,
          branchCode: branch.branchCode,
          companyId: branch.companyId
        }
      },
      message: 'Repartidor creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear repartidor:', error);
    
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

// Actualizar un repartidor
const updateDeliveryDriver = async (req, res) => {
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

    // Verificar si el repartidor existe
    const existingDriver = await User.findById(id);
    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado'
      });
    }

    // Verificar si el username ya existe en otro usuario
    if (username && username !== existingDriver.username) {
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
    if (email && email !== existingDriver.email) {
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
        ...existingDriver.profile,
        ...(profile.name && { name: profile.name }),
        ...(profile.lastName && { lastName: profile.lastName }),
        ...(estatus !== undefined && { estatus })
      };

      // Actualizar fullName si name o lastName cambian
      if (profile.name || profile.lastName) {
        const newName = profile.name || existingDriver.profile.name;
        const newLastName = profile.lastName || existingDriver.profile.lastName;
        updateData.profile.fullName = `${newName} ${newLastName}`;
      }
    } else if (estatus !== undefined) {
      updateData.profile = {
        ...existingDriver.profile,
        estatus
      };
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedDriver = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    // Obtener la sucursal del repartidor
    const branch = await Branch.findOne({
      employees: updatedDriver._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...updatedDriver.toObject(),
        branch: branch || null
      },
      message: 'Repartidor actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar repartidor:', error);

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

// Eliminar un repartidor
const deleteDeliveryDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDriver = await User.findByIdAndDelete(id);

    if (!deletedDriver) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado'
      });
    }

    // Remover el repartidor del array employees de todas las sucursales
    await Branch.updateMany(
      { employees: id },
      { $pull: { employees: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Repartidor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar repartidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un repartidor
const activateDeliveryDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryDriver = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': true },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!deliveryDriver) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado'
      });
    }

    // Obtener la sucursal del repartidor
    const branch = await Branch.findOne({
      employees: deliveryDriver._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...deliveryDriver.toObject(),
        branch: branch || null
      },
      message: 'Repartidor activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar repartidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un repartidor
const deactivateDeliveryDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryDriver = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': false },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!deliveryDriver) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado'
      });
    }

    // Obtener la sucursal del repartidor
    const branch = await Branch.findOne({
      employees: deliveryDriver._id
    }).select('branchName branchCode companyId');

    res.status(200).json({
      success: true,
      data: {
        ...deliveryDriver.toObject(),
        branch: branch || null
      },
      message: 'Repartidor desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar repartidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
  activateDeliveryDriver,
  deactivateDeliveryDriver
};