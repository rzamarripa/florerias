import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Branch } from '../models/Branch.js';
import { Role } from '../models/Roles.js';
import bcrypt from 'bcryptjs';

// Obtener todos los usuarios de redes con filtros y paginación
const getAllNetworksUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      estatus,
      companyId
    } = req.query;

    // Buscar el rol de Redes
    const redesRole = await Role.findOne({ name: /^Redes$/i });
    if (!redesRole) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el rol de Redes. Por favor, créalo en la sección de roles.'
      });
    }

    // Construir filtros
    const filters = { role: redesRole._id };

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

    // Si se especifica companyId, filtrar solo usuarios de esa empresa
    if (companyId) {
      const company = await Company.findById(companyId).select('redes');
      if (company && company.redes && company.redes.length > 0) {
        filters._id = { $in: company.redes };
      } else {
        // No hay usuarios de redes en esta empresa
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener usuarios de redes con paginación
    const networksUsers = await User.find(filters)
      .select('-password')
      .populate('role', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Obtener la empresa de cada usuario de redes
    const usersWithCompany = await Promise.all(
      networksUsers.map(async (user) => {
        const company = await Company.findOne({
          redes: user._id
        }).select('legalName tradeName rfc');

        return {
          ...user.toObject(),
          company: company || null
        };
      })
    );

    // Contar total de documentos
    const total = await User.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: usersWithCompany,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios de redes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un usuario de redes por ID
const getNetworksUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const networksUser = await User.findById(id)
      .select('-password')
      .populate('role', 'name description');

    if (!networksUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de redes no encontrado'
      });
    }

    // Obtener la empresa del usuario
    const company = await Company.findOne({
      redes: networksUser._id
    }).select('legalName tradeName rfc');

    res.status(200).json({
      success: true,
      data: {
        ...networksUser.toObject(),
        company: company || null
      }
    });
  } catch (error) {
    console.error('Error al obtener usuario de redes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo usuario de redes
const createNetworksUser = async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      profile,
      companyId
    } = req.body;

    // Si no se envió companyId, auto-resolver desde el usuario autenticado
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && req.user?.role) {
      const userRole = req.user.role.name || (await Role.findById(req.user.role).select('name').lean())?.name;

      if (userRole === 'Gerente') {
        const branch = await Branch.findOne({ manager: req.user._id }).select('_id').lean();
        if (branch) {
          const comp = await Company.findOne({ branches: branch._id }).select('_id').lean();
          if (comp) resolvedCompanyId = comp._id;
        }
      } else if (userRole === 'Administrador') {
        const company = await Company.findOne({ administrator: req.user._id }).select('_id').lean();
        if (company) {
          resolvedCompanyId = company._id;
        } else {
          const branch = await Branch.findOne({ administrator: req.user._id }).select('_id').lean();
          if (branch) {
            const comp = await Company.findOne({ branches: branch._id }).select('_id').lean();
            if (comp) resolvedCompanyId = comp._id;
          }
        }
      }
    }

    // Validaciones básicas
    if (!username || !email || !phone || !password || !profile?.name || !profile?.lastName || !resolvedCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Buscar el rol de Redes
    const redesRole = await Role.findOne({ name: /^Redes$/i });
    if (!redesRole) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el rol de Redes'
      });
    }

    // Verificar que la empresa existe
    const company = await Company.findById(resolvedCompanyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
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

    // Crear el nuevo usuario de redes
    const newNetworksUser = new User({
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
      role: redesRole._id
    });

    await newNetworksUser.save();

    // Agregar el usuario de redes a la empresa
    company.redes.push(newNetworksUser._id);
    await company.save();

    // Obtener el usuario creado con populate
    const createdNetworksUser = await User.findById(newNetworksUser._id)
      .select('-password')
      .populate('role', 'name description');

    res.status(201).json({
      success: true,
      data: {
        ...createdNetworksUser.toObject(),
        company: {
          _id: company._id,
          legalName: company.legalName,
          tradeName: company.tradeName,
          rfc: company.rfc
        }
      },
      message: 'Usuario de redes creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear usuario de redes:', error);

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

// Actualizar un usuario de redes
const updateNetworksUser = async (req, res) => {
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
        message: 'Usuario de redes no encontrado'
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

    // Obtener la empresa del usuario
    const company = await Company.findOne({
      redes: updatedUser._id
    }).select('legalName tradeName rfc');

    res.status(200).json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        company: company || null
      },
      message: 'Usuario de redes actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario de redes:', error);

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

// Eliminar un usuario de redes
const deleteNetworksUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de redes no encontrado'
      });
    }

    // Remover el usuario del array redes de todas las empresas
    await Company.updateMany(
      { redes: id },
      { $pull: { redes: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Usuario de redes eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario de redes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un usuario de redes
const activateNetworksUser = async (req, res) => {
  try {
    const { id } = req.params;

    const networksUser = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': true },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!networksUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de redes no encontrado'
      });
    }

    // Obtener la empresa del usuario
    const company = await Company.findOne({
      redes: networksUser._id
    }).select('legalName tradeName rfc');

    res.status(200).json({
      success: true,
      data: {
        ...networksUser.toObject(),
        company: company || null
      },
      message: 'Usuario de redes activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar usuario de redes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un usuario de redes
const deactivateNetworksUser = async (req, res) => {
  try {
    const { id } = req.params;

    const networksUser = await User.findByIdAndUpdate(
      id,
      { 'profile.estatus': false },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    if (!networksUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de redes no encontrado'
      });
    }

    // Obtener la empresa del usuario
    const company = await Company.findOne({
      redes: networksUser._id
    }).select('legalName tradeName rfc');

    res.status(200).json({
      success: true,
      data: {
        ...networksUser.toObject(),
        company: company || null
      },
      message: 'Usuario de redes desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar usuario de redes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllNetworksUsers,
  getNetworksUserById,
  createNetworksUser,
  updateNetworksUser,
  deleteNetworksUser,
  activateNetworksUser,
  deactivateNetworksUser
};