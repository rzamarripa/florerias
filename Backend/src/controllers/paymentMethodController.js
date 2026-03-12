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

    console.log('[PaymentMethods] Usuario:', userId, 'Rol:', userRole);

    // Construir filtros
    const filters = {};

    // Filtrar por empresa según el rol del usuario
    if (userRole === 'Administrador') {
      const company = await Company.findOne({ administrator: userId });

      if (company) {
        filters.company = company._id;
      } else {
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
      const managerBranch = await Branch.findOne({ manager: userId });

      if (managerBranch) {
        const company = await Company.findOne({ branches: managerBranch._id });

        if (company) {
          filters.company = company._id;
        } else {
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
      const cashierBranch = await Branch.findOne({
        $or: [
          { cashiers: userId },
          { employees: userId }
        ]
      });

      if (cashierBranch) {
        const company = await Company.findOne({ branches: cashierBranch._id });

        if (company) {
          filters.company = company._id;
        } else {
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
    } else if (userRole === 'Redes') {
      const userCompany = await Company.findOne({ redes: userId });
      if (userCompany) {
        filters.company = userCompany._id;
      } else {
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
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver métodos de pago'
      });
    }
    // Super Admin puede ver todos los métodos de pago (no se agrega filtro de company)

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

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    // Determinar la empresa según el rol
    let companyId = null;

    if (userRole === 'Administrador') {
      const company = await Company.findOne({ administrator: userId });
      if (company) {
        companyId = company._id;
      }
    } else if (userRole === 'Gerente') {
      const managerBranch = await Branch.findOne({ manager: userId });
      if (managerBranch) {
        const company = await Company.findOne({ branches: managerBranch._id });
        if (company) {
          companyId = company._id;
        }
      }
    } else if (userRole !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear métodos de pago'
      });
    }
    // Super Admin: companyId queda como null

    // Verificar que no exista un método de pago con el mismo nombre en la misma empresa
    const duplicateFilter = { name: name.trim() };
    if (companyId) {
      duplicateFilter.company = companyId;
    }

    const existingPaymentMethod = await PaymentMethod.findOne(duplicateFilter);

    if (existingPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un método de pago con este nombre en esta empresa'
      });
    }

    // Crear nuevo método de pago
    const newPaymentMethod = new PaymentMethod({
      name,
      abbreviation,
      company: companyId,
    });

    const savedPaymentMethod = await newPaymentMethod.save();

    // Popular la empresa para la respuesta
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
        message: 'Ya existe un método de pago con ese nombre en esta empresa'
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
    ).populate('company', 'legalName tradeName');

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
        message: 'Ya existe un método de pago con ese nombre en esta empresa'
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
