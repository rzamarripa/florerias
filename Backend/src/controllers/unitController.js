import Unit from '../models/Unit.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Obtener todas las unidades con filtros y paginación
const getAllUnits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      name
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

    // Construir filtros
    const filters = {};

    // Filtrar por empresa según el rol del usuario
    if (userRole === 'Administrador') {
      // Buscar la empresa del administrador
      const company = await Company.findOne({
        administrator: userId,
      });

      if (company) {
        filters.company = company._id;
      } else {
        // Si no tiene empresa, no retornar ninguna unidad
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
    } else if (userRole === 'Gerente') {
      // Buscar la sucursal del gerente
      const managerBranch = await Branch.findOne({
        manager: userId,
      });

      if (managerBranch) {
        // Buscar la empresa por el ID de la sucursal
        const company = await Company.findOne({
          branches: managerBranch._id,
        });

        if (company) {
          filters.company = company._id;
        } else {
          // Si no tiene empresa, no retornar ninguna unidad
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
      } else {
        // Si no tiene sucursal, no retornar ninguna unidad
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
    // Super Admin puede ver todas las unidades (no se agrega filtro de company)

    if (status !== undefined) {
      filters.status = status === 'true';
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener unidades con paginación
    const units = await Unit.find(filters)
      .populate('company', 'legalName tradeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Unit.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: units,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una unidad por ID
const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findById(id)
      .populate('company', 'legalName tradeName');

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error al obtener unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva unidad
const createUnit = async (req, res) => {
  try {
    const { name, abbreviation } = req.body;
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
        message: 'El nombre y la abreviatura son obligatorios'
      });
    }

    // Obtener el company ID según el rol del usuario
    let companyId = null;

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (currentUser && currentUser.role) {
      const userRole = currentUser.role.name;

      if (userRole === 'Administrador') {
        // Buscar la empresa por el campo administrator
        const company = await Company.findOne({
          administrator: userId,
        });

        if (company) {
          companyId = company._id;
        }
      } else if (userRole === 'Gerente') {
        // Buscar la sucursal del gerente
        const managerBranch = await Branch.findOne({
          manager: userId,
        });

        if (managerBranch) {
          // Buscar la empresa por el ID de la sucursal
          const company = await Company.findOne({
            branches: managerBranch._id,
          });

          if (company) {
            companyId = company._id;
          }
        }
      }
      // Super Admin: companyId queda como null
    }

    // Crear nueva unidad
    const newUnit = new Unit({
      name,
      abbreviation,
      company: companyId,
    });

    const savedUnit = await newUnit.save();

    // Popular la empresa para la respuesta
    await savedUnit.populate('company', 'legalName tradeName');

    res.status(201).json({
      success: true,
      data: savedUnit,
      message: 'Unidad creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear unidad:', error);

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
        message: 'Ya existe una unidad con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar una unidad
const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si la unidad existe
    const existingUnit = await Unit.findById(id);
    if (!existingUnit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    const updatedUnit = await Unit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName');

    res.status(200).json({
      success: true,
      data: updatedUnit,
      message: 'Unidad actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar unidad:', error);

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
        message: 'Ya existe una unidad con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar estado de unidad
const updateUnitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const unit = await Unit.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName');

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: unit,
      message: 'Estado de unidad actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una unidad
const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUnit = await Unit.findByIdAndDelete(id);

    if (!deletedUnit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  updateUnitStatus,
  deleteUnit
};
