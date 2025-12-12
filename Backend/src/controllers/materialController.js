import Material from '../models/Material.js';
import Unit from '../models/Unit.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Obtener todos los materiales con filtros y paginación
const getAllMaterials = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      name,
      unitId
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
        // Si no tiene empresa, no retornar ningún material
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
          // Si no tiene empresa, no retornar ningún material
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
        // Si no tiene sucursal, no retornar ningún material
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
    // Super Admin puede ver todos los materiales (no se agrega filtro de company)

    if (status !== undefined) {
      filters.status = status === 'true';
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    if (unitId) {
      filters.unit = unitId;
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener materiales con paginación
    const materials = await Material.find(filters)
      .populate('unit', 'name abbreviation')
      .populate('company', 'legalName tradeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Material.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un material por ID
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findById(id)
      .populate('unit', 'name abbreviation')
      .populate('company', 'legalName tradeName');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error al obtener material:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo material
const createMaterial = async (req, res) => {
  try {
    const {
      name,
      unit,
      price,
      cost,
      piecesPerPackage,
      description
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!name || !unit || price === undefined || cost === undefined || piecesPerPackage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre, unidad, precio, costo y piezas por paquete son obligatorios'
      });
    }

    // Validar que la unidad exista
    const unitExists = await Unit.findById(unit);
    if (!unitExists) {
      return res.status(404).json({
        success: false,
        message: 'La unidad especificada no existe'
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

    // Crear nuevo material
    const newMaterial = new Material({
      name,
      unit,
      price,
      cost,
      piecesPerPackage,
      description: description || '',
      company: companyId,
    });

    const savedMaterial = await newMaterial.save();

    // Popular el material guardado antes de devolverlo
    const populatedMaterial = await Material.findById(savedMaterial._id)
      .populate('unit', 'name abbreviation')
      .populate('company', 'legalName tradeName');

    res.status(201).json({
      success: true,
      data: populatedMaterial,
      message: 'Material creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear material:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un material
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el material existe
    const existingMaterial = await Material.findById(id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }

    // Si se actualiza la unidad, validar que exista
    if (updateData.unit) {
      const unitExists = await Unit.findById(updateData.unit);
      if (!unitExists) {
        return res.status(404).json({
          success: false,
          message: 'La unidad especificada no existe'
        });
      }
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('unit', 'name abbreviation')
     .populate('company', 'legalName tradeName');

    res.status(200).json({
      success: true,
      data: updatedMaterial,
      message: 'Material actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar material:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar estado de material
const updateMaterialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const material = await Material.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('unit', 'name abbreviation')
     .populate('company', 'legalName tradeName');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: material,
      message: 'Estado de material actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de material:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un material
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMaterial = await Material.findByIdAndDelete(id);

    if (!deletedMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Material eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar material:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  updateMaterialStatus,
  deleteMaterial
};
