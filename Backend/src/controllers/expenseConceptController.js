import { ExpenseConcept } from "../models/ExpenseConcept.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";

// Helper: determinar companyId según el rol del usuario
const getCompanyIdForUser = async (userId, userRole) => {
  if (userRole === "Administrador") {
    const company = await Company.findOne({ administrator: userId });
    return company ? company._id : null;
  } else if (userRole === "Gerente") {
    const managerBranch = await Branch.findOne({ manager: userId });
    if (managerBranch) {
      const company = await Company.findOne({ branches: managerBranch._id });
      return company ? company._id : null;
    }
    return null;
  }
  // Super Admin: null
  return null;
};

// Helper: verificar permisos por empresa
const verifyCompanyPermission = async (concept, userId, userRole) => {
  if (userRole === "Super Admin") return true;

  const companyId = await getCompanyIdForUser(userId, userRole);
  if (!companyId) return false;

  return concept.company && concept.company.toString() === companyId.toString();
};

// Crear nuevo concepto de gasto
export const createExpenseConcept = async (req, res) => {
  try {
    const { name, description, department } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Determinar la empresa según el rol
    let companyId = null;

    if (userRole === "Administrador") {
      const company = await Company.findOne({ administrator: req.user._id });
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la empresa asociada al administrador",
        });
      }
      companyId = company._id;
    } else if (userRole === "Gerente") {
      const managerBranch = await Branch.findOne({ manager: req.user._id });
      if (!managerBranch) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una sucursal asignada al gerente",
        });
      }
      const company = await Company.findOne({ branches: managerBranch._id });
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la empresa asociada a la sucursal",
        });
      }
      companyId = company._id;
    } else if (userRole === "Super Admin") {
      // Super Admin: companyId queda como null
    } else {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear conceptos de gasto",
      });
    }

    const expenseConcept = await ExpenseConcept.create({
      name,
      description,
      department,
      company: companyId,
    });

    await expenseConcept.populate("company", "companyName");

    res.status(201).json({
      success: true,
      message: "Concepto de gasto creado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un concepto de gasto con ese nombre en esta empresa",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todos los conceptos de gasto
export const getAllExpenseConcepts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Filtrado por empresa según el rol
    if (userRole === "Super Admin") {
      // Super Admin puede ver todos los conceptos
    } else if (userRole === "Administrador") {
      const company = await Company.findOne({ administrator: req.user._id });
      if (company) {
        filters.company = company._id;
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: { page, limit, total: 0, pages: 0 },
          data: [],
        });
      }
    } else if (userRole === "Gerente") {
      const managerBranch = await Branch.findOne({ manager: req.user._id });
      if (managerBranch) {
        const company = await Company.findOne({ branches: managerBranch._id });
        if (company) {
          filters.company = company._id;
        } else {
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: { page, limit, total: 0, pages: 0 },
            data: [],
          });
        }
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: { page, limit, total: 0, pages: 0 },
          data: [],
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver conceptos de gasto",
      });
    }

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.department) {
      filters.department = req.query.department;
    }

    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const expenseConcepts = await ExpenseConcept.find(filters)
      .populate("company", "companyName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ExpenseConcept.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: expenseConcepts.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: expenseConcepts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener concepto de gasto por ID
export const getExpenseConceptById = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const expenseConcept = await ExpenseConcept.findById(req.params.id)
      .populate("company", "companyName");

    if (!expenseConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos por empresa
    const hasPermission = await verifyCompanyPermission(expenseConcept, req.user._id, userRole);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver este concepto",
      });
    }

    res.status(200).json({
      success: true,
      data: expenseConcept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar concepto de gasto
export const updateExpenseConcept = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const existingConcept = await ExpenseConcept.findById(req.params.id);

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos por empresa
    const hasPermission = await verifyCompanyPermission(existingConcept, req.user._id, userRole);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar este concepto",
      });
    }

    const { name, description, department } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (department) updateData.department = department;

    const expenseConcept = await ExpenseConcept.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("company", "companyName");

    res.status(200).json({
      success: true,
      message: "Concepto de gasto actualizado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un concepto de gasto con ese nombre en esta empresa",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar concepto de gasto
export const deactivateExpenseConcept = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const existingConcept = await ExpenseConcept.findById(req.params.id);

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos por empresa
    const hasPermission = await verifyCompanyPermission(existingConcept, req.user._id, userRole);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para desactivar este concepto",
      });
    }

    const expenseConcept = await ExpenseConcept.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate("company", "companyName");

    res.status(200).json({
      success: true,
      message: "Concepto de gasto desactivado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar concepto de gasto
export const activateExpenseConcept = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const existingConcept = await ExpenseConcept.findById(req.params.id);

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos por empresa
    const hasPermission = await verifyCompanyPermission(existingConcept, req.user._id, userRole);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para activar este concepto",
      });
    }

    const expenseConcept = await ExpenseConcept.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).populate("company", "companyName");

    res.status(200).json({
      success: true,
      message: "Concepto de gasto activado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar concepto de gasto (físicamente)
export const deleteExpenseConcept = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const existingConcept = await ExpenseConcept.findById(req.params.id);

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos por empresa
    const hasPermission = await verifyCompanyPermission(existingConcept, req.user._id, userRole);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar este concepto",
      });
    }

    const expenseConcept = await ExpenseConcept.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Concepto de gasto eliminado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
