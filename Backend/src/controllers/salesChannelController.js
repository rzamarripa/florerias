import { SalesChannel } from '../models/SalesChannel.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Obtener todos los canales de venta con filtros y paginación
const getAllSalesChannels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      companyId
    } = req.query;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    // Solo Gerentes, Cajeros y Super Admin pueden acceder a este módulo
    if (userRole !== 'Gerente' && userRole !== 'Cajero' && userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a los canales de venta'
      });
    }

    // Construir filtros
    const filters = {};

    // Si se proporciona companyId específico, usarlo
    if (companyId) {
      filters.companyId = companyId;
    } else {
      // Si es Gerente, obtener su empresa a través de la sucursal donde es gerente
      if (userRole === 'Gerente') {
        // Buscar la sucursal donde es gerente
        const managerBranch = await Branch.findOne({ manager: userId });
        
        if (managerBranch && managerBranch.companyId) {
          filters.companyId = managerBranch.companyId;
        } else {
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
          });
        }
      }
      // Si es Cajero, obtener su empresa a través de la sucursal donde es empleado
      else if (userRole === 'Cajero') {
        // Buscar la sucursal donde es empleado
        const employeeBranch = await Branch.findOne({ employees: userId });
        
        if (employeeBranch && employeeBranch.companyId) {
          filters.companyId = employeeBranch.companyId;
        } else {
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
          });
        }
      }
      // Super Admin puede ver todos los canales (no se agrega filtro de companyId)
    }

    if (status) {
      filters.status = status;
    }

    // Búsqueda por nombre o abreviatura
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { abbreviation: { $regex: search, $options: 'i' } }
      ];
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener canales con paginación
    const salesChannels = await SalesChannel.find(filters)
      .populate('companyId', 'legalName tradeName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await SalesChannel.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: salesChannels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener canales de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un canal de venta por ID
const getSalesChannelById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const salesChannel = await SalesChannel.findById(id)
      .populate('companyId', 'legalName tradeName');

    if (!salesChannel) {
      return res.status(404).json({
        success: false,
        message: 'Canal de venta no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: salesChannel
    });
  } catch (error) {
    console.error('Error al obtener canal de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo canal de venta
const createSalesChannel = async (req, res) => {
  try {
    const {
      name,
      abbreviation,
      status = 'active'
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!name || !abbreviation) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre y abreviatura son obligatorios'
      });
    }

    // Validar status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estatus inválido. Debe ser "active" o "inactive"'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');
    const userRole = currentUser?.role?.name;

    // Solo los gerentes pueden crear canales de venta
    if (userRole !== 'Gerente' && userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear canales de venta'
      });
    }

    // Obtener la empresa del gerente
    let finalCompanyId = null;

    if (userRole === 'Gerente') {
      // Buscar la sucursal donde es gerente
      const managerBranch = await Branch.findOne({ manager: userId });
      
      if (!managerBranch || !managerBranch.companyId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo determinar la empresa asociada al gerente'
        });
      }

      finalCompanyId = managerBranch.companyId;
    } else if (userRole === 'Super Admin') {
      // Para Super Admin, requerir que se especifique la empresa
      if (!req.body.companyId) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar una empresa'
        });
      }
      finalCompanyId = req.body.companyId;
    }

    // Verificar que la empresa existe
    const company = await Company.findById(finalCompanyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Verificar si ya existe un canal con el mismo nombre en la misma empresa
    const existingChannel = await SalesChannel.findOne({
      $or: [
        { name: name.trim(), companyId: finalCompanyId },
        { abbreviation: abbreviation.trim().toUpperCase(), companyId: finalCompanyId }
      ]
    });

    if (existingChannel) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un canal de venta con este nombre o abreviatura en esta empresa'
      });
    }

    // Crear nuevo canal de venta
    const newSalesChannel = new SalesChannel({
      name,
      abbreviation: abbreviation.toUpperCase(),
      status,
      companyId: finalCompanyId,
    });

    const savedSalesChannel = await newSalesChannel.save();

    // Popular la empresa para la respuesta
    await savedSalesChannel.populate('companyId', 'legalName tradeName');

    res.status(201).json({
      success: true,
      data: savedSalesChannel,
      message: 'Canal de venta creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear canal de venta:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un canal de venta con este nombre o abreviatura en esta empresa'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un canal de venta
const updateSalesChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar si el canal existe
    const existingSalesChannel = await SalesChannel.findById(id);
    if (!existingSalesChannel) {
      return res.status(404).json({
        success: false,
        message: 'Canal de venta no encontrado'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');
    const userRole = currentUser?.role?.name;

    // Verificar permisos
    if (userRole === 'Gerente') {
      // Verificar que el gerente pertenece a la misma empresa
      const managerBranch = await Branch.findOne({ manager: userId });
      
      if (!managerBranch || managerBranch.companyId.toString() !== existingSalesChannel.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este canal de venta'
        });
      }
    } else if (userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar canales de venta'
      });
    }

    // Validar status si se está actualizando
    if (updateData.status && !['active', 'inactive'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Estatus inválido. Debe ser "active" o "inactive"'
      });
    }

    // Formatear abreviatura si se está actualizando
    if (updateData.abbreviation) {
      updateData.abbreviation = updateData.abbreviation.toUpperCase();
    }

    // Si se está actualizando el nombre o abreviatura, verificar unicidad
    if (updateData.name || updateData.abbreviation) {
      const checkConditions = [];
      
      if (updateData.name && updateData.name.trim() !== existingSalesChannel.name) {
        checkConditions.push({ name: updateData.name.trim(), companyId: existingSalesChannel.companyId });
      }
      
      if (updateData.abbreviation && updateData.abbreviation !== existingSalesChannel.abbreviation) {
        checkConditions.push({ abbreviation: updateData.abbreviation, companyId: existingSalesChannel.companyId });
      }

      if (checkConditions.length > 0) {
        const duplicateChannel = await SalesChannel.findOne({
          $or: checkConditions,
          _id: { $ne: id }
        });

        if (duplicateChannel) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un canal de venta con este nombre o abreviatura en esta empresa'
          });
        }
      }
    }

    const updatedSalesChannel = await SalesChannel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('companyId', 'legalName tradeName');

    res.status(200).json({
      success: true,
      data: updatedSalesChannel,
      message: 'Canal de venta actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar canal de venta:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un canal de venta con este nombre o abreviatura en esta empresa'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un canal de venta
const deleteSalesChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const salesChannel = await SalesChannel.findById(id);

    if (!salesChannel) {
      return res.status(404).json({
        success: false,
        message: 'Canal de venta no encontrado'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');
    const userRole = currentUser?.role?.name;

    // Verificar permisos
    if (userRole === 'Gerente') {
      // Verificar que el gerente pertenece a la misma empresa
      const managerBranch = await Branch.findOne({ manager: userId });
      
      if (!managerBranch || managerBranch.companyId.toString() !== salesChannel.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este canal de venta'
        });
      }
    } else if (userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar canales de venta'
      });
    }

    await SalesChannel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Canal de venta eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar canal de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllSalesChannels,
  getSalesChannelById,
  createSalesChannel,
  updateSalesChannel,
  deleteSalesChannel
};