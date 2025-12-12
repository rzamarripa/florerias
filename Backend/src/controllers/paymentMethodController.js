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
      // Buscar la empresa del administrador
      const company = await Company.findOne({
        administrator: userId,
      });

      if (company) {
        filters.company = company._id;
      } else {
        // Si no tiene empresa, no retornar ningún método de pago
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
          // Si no tiene empresa, no retornar ningún método de pago
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
    } else if (userRole === 'Cajero') {
      // Para Cajero, buscar la sucursal donde está asignado
      const userBranch = await Branch.findOne({
        employees: userId
      });

      console.log('[PaymentMethods] Cajero - Sucursal encontrada:', userBranch?._id);

      if (userBranch) {
        // Buscar la empresa que contiene esta sucursal
        const company = await Company.findOne({
          branches: userBranch._id
        });

        console.log('[PaymentMethods] Cajero - Empresa encontrada:', company?._id);

        if (company) {
          filters.company = company._id;
        } else {
          // Si no tiene empresa, no retornar ningún método de pago
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
    } else if (userRole === 'Redes') {
      // Para Redes, buscar la empresa donde está en el array redes
      const company = await Company.findOne({
        redes: userId
      });

      console.log('[PaymentMethods] Redes - Empresa encontrada:', company?._id);

      if (company) {
        filters.company = company._id;
      } else {
        // Si no está en ninguna empresa, no retornar ningún método de pago
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
