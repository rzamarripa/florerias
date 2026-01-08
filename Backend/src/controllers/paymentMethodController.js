import PaymentMethod from '../models/PaymentMethod.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Obtener todos los métodos de pago con filtros y paginación
const getAllPaymentMethods = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      name,
      branchId
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

    console.log('[PaymentMethods] Usuario:', userId, 'Rol:', userRole);

    // Construir filtros
    const filters = {};

    // Si se proporciona un branchId específico, usarlo directamente
    if (branchId) {
      filters.branch = branchId;
    } else {
      // Si no se proporciona branchId, filtrar por sucursal según el rol del usuario
      if (userRole === 'Administrador') {
        // Buscar las sucursales del administrador
        const branches = await Branch.find({
          administrator: userId,
        });

        if (branches.length > 0) {
          filters.branch = { $in: branches.map(b => b._id) };
        } else {
          // Si no tiene sucursales, no retornar ningún método de pago
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
          filters.branch = managerBranch._id;
        } else {
          // Si no tiene sucursal, no retornar ningún método de pago
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
      } else if (userRole === 'Cajero' || userRole === 'Cashier') {
        // Para cajeros, buscar en qué sucursal están asignados
        const cashierBranch = await Branch.findOne({
          $or: [
            { cashiers: userId },
            { employees: userId }
          ]
        });

        if (cashierBranch) {
          filters.branch = cashierBranch._id;
        } else {
          // Si no tiene sucursal, no retornar ningún método de pago
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
      } else if (userRole !== 'Super Admin') {
        // Otros roles no tienen acceso
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver métodos de pago'
        });
      }
      // Super Admin puede ver todos los métodos de pago (no se agrega filtro de branch)
    }

    if (status !== undefined) {
      filters.status = status === 'true';
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('[PaymentMethods] Filtros aplicados:', filters);

    // Obtener métodos de pago con paginación
    const paymentMethods = await PaymentMethod.find(filters)
      .populate('branch', 'branchName branchCode')
      .populate('company', 'legalName tradeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await PaymentMethod.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    console.log('[PaymentMethods] Total encontrados:', total, 'Retornando:', paymentMethods.length);

    res.status(200).json({
      success: true,
      data: paymentMethods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un método de pago por ID
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findById(id)
      .populate('branch', 'branchName branchCode')
      .populate('company', 'legalName tradeName');

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Error al obtener método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo método de pago
const createPaymentMethod = async (req, res) => {
  try {
    const { name, abbreviation, branch: branchId } = req.body;
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

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    // Determinar la sucursal y empresa según el rol
    let finalBranchId = branchId;
    let companyId = null;

    if (userRole === 'Gerente') {
      // Para Gerente, buscar su sucursal automáticamente
      const managerBranch = await Branch.findOne({ manager: userId });
      if (managerBranch) {
        finalBranchId = managerBranch._id;
        
        // Buscar la empresa asociada
        const company = await Company.findOne({
          branches: managerBranch._id,
        });
        if (company) {
          companyId = company._id;
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'No se encontró una sucursal asignada al gerente'
        });
      }
    } else if (userRole === 'Administrador') {
      // Para Administrador, debe venir el branchId
      if (!finalBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar una sucursal'
        });
      }

      // Verificar que la sucursal existe y le pertenece
      const branch = await Branch.findById(finalBranchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      if (branch.administrator.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear métodos de pago en esta sucursal'
        });
      }

      // Buscar la empresa
      const company = await Company.findOne({
        administrator: userId,
      });
      if (company) {
        companyId = company._id;
      }
    } else if (userRole === 'Super Admin') {
      // Super Admin debe especificar sucursal
      if (!finalBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar una sucursal'
        });
      }

      // Verificar que la sucursal existe
      const branch = await Branch.findById(finalBranchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      // Buscar la empresa asociada
      const company = await Company.findOne({
        branches: finalBranchId,
      });
      if (company) {
        companyId = company._id;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear métodos de pago'
      });
    }

    // Verificar que no exista un método de pago con el mismo nombre en la misma sucursal
    const existingPaymentMethod = await PaymentMethod.findOne({
      name: name.trim(),
      branch: finalBranchId
    });

    if (existingPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un método de pago con este nombre en esta sucursal'
      });
    }

    // Crear nuevo método de pago
    const newPaymentMethod = new PaymentMethod({
      name,
      abbreviation,
      branch: finalBranchId,
      company: companyId,
    });

    const savedPaymentMethod = await newPaymentMethod.save();

    // Popular la sucursal y empresa para la respuesta
    await savedPaymentMethod.populate('branch', 'branchName branchCode');
    await savedPaymentMethod.populate('company', 'legalName tradeName');

    res.status(201).json({
      success: true,
      data: savedPaymentMethod,
      message: 'Método de pago creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear método de pago:', error);

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
        message: 'Ya existe un método de pago con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un método de pago
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el método de pago existe
    const existingPaymentMethod = await PaymentMethod.findById(id);
    if (!existingPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('branch', 'branchName branchCode')
      .populate('company', 'legalName tradeName');

    res.status(200).json({
      success: true,
      data: updatedPaymentMethod,
      message: 'Método de pago actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar método de pago:', error);

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
        message: 'Ya existe un método de pago con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar estado de método de pago
const updatePaymentMethodStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName');

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod,
      message: 'Estado de método de pago actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un método de pago
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(id);

    if (!deletedPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Método de pago eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  updatePaymentMethodStatus,
  deletePaymentMethod
};
