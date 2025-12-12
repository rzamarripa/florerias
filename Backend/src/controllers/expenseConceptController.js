import { ExpenseConcept } from "../models/ExpenseConcept.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";

// Crear nuevo concepto de gasto
export const createExpenseConcept = async (req, res) => {
  try {
    const { name, description, department, branch } = req.body;

    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que la sucursal existe
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Obtener el company ID según el rol del usuario
    let companyId = null;

    if (userRole === "Administrador") {
      // Verificar que la sucursal le pertenece
      if (branchExists.administrator.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear conceptos en esta sucursal",
        });
      }

      // Buscar la empresa por el campo administrator
      const company = await Company.findOne({
        administrator: req.user._id,
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la empresa asociada al administrador",
        });
      }

      companyId = company._id;
    } else if (userRole === "Gerente") {
      // Verificar que es el gerente de la sucursal
      if (branchExists.manager.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear conceptos en esta sucursal",
        });
      }

      // Buscar la empresa por el ID de la sucursal
      const company = await Company.findOne({
        branches: branchExists._id,
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la empresa asociada a la sucursal",
        });
      }

      companyId = company._id;
    } else if (userRole === "Super Admin") {
      // Super Admin: buscar la empresa por el ID de la sucursal
      const company = await Company.findOne({
        branches: branchExists._id,
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la empresa asociada a la sucursal",
        });
      }

      companyId = company._id;
    } else {
      // Otros roles no tienen permiso
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear conceptos de gasto",
      });
    }

    const expenseConcept = await ExpenseConcept.create({
      name,
      description,
      department,
      branch,
      company: companyId,
    });

    // Popular la sucursal y la empresa para la respuesta
    await expenseConcept.populate("branch", "branchName branchCode");
    await expenseConcept.populate("company", "companyName");

    res.status(201).json({
      success: true,
      message: "Concepto de gasto creado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todos los conceptos de gasto
export const getAllExpenseConcepts = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
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

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Filtrado por rol
    if (userRole === "Super Admin") {
      // Super Admin puede ver todos los conceptos
      // Si envía branchId como filtro, aplicarlo
      if (req.query.branch) {
        filters.branch = req.query.branch;
      }
    } else if (userRole === "Administrador") {
      // Administrador solo ve conceptos de sus sucursales
      const userBranches = await Branch.find({
        administrator: req.user._id,
      }).select("_id");

      const branchIds = userBranches.map((branch) => branch._id);

      // Si envía un filtro de sucursal específica, verificar que le pertenece
      if (req.query.branch) {
        const branchIdStr = req.query.branch;
        if (branchIds.some(id => id.toString() === branchIdStr)) {
          filters.branch = branchIdStr;
        } else {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver conceptos de esta sucursal",
          });
        }
      } else {
        filters.branch = { $in: branchIds };
      }
    } else if (userRole === "Gerente") {
      // Gerente solo ve conceptos de su sucursal
      const userBranch = await Branch.findOne({
        manager: req.user._id,
      }).select("_id");

      if (!userBranch) {
        return res.status(403).json({
          success: false,
          message: "No tienes una sucursal asignada",
        });
      }

      filters.branch = userBranch._id;
    } else {
      // Otros roles no tienen acceso
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
      .populate("branch", "branchName branchCode")
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
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const expenseConcept = await ExpenseConcept.findById(
      req.params.id
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "companyName");

    if (!expenseConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      const branch = await Branch.findById(expenseConcept.branch._id);

      if (userRole === "Administrador") {
        if (branch.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver este concepto",
          });
        }
      } else if (userRole === "Gerente") {
        if (branch.manager.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver este concepto",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para ver este concepto",
        });
      }
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
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que el concepto existe
    const existingConcept = await ExpenseConcept.findById(
      req.params.id
    ).populate("branch");

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      const branch = await Branch.findById(existingConcept.branch._id);

      if (userRole === "Administrador") {
        if (branch.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para actualizar este concepto",
          });
        }
      } else if (userRole === "Gerente") {
        if (branch.manager.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para actualizar este concepto",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para actualizar este concepto",
        });
      }
    }

    const { name, description, department, branch } = req.body;

    // Si se está actualizando la sucursal, verificar que exista
    if (branch && branch !== existingConcept.branch._id.toString()) {
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(404).json({
          success: false,
          message: "Sucursal no encontrada",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (department) updateData.department = department;
    if (branch) updateData.branch = branch;

    const expenseConcept = await ExpenseConcept.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "companyName");

    res.status(200).json({
      success: true,
      message: "Concepto de gasto actualizado exitosamente",
      data: expenseConcept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar concepto de gasto
export const deactivateExpenseConcept = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que el concepto existe
    const existingConcept = await ExpenseConcept.findById(
      req.params.id
    ).populate("branch");

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      const branch = await Branch.findById(existingConcept.branch._id);

      if (userRole === "Administrador") {
        if (branch.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para desactivar este concepto",
          });
        }
      } else if (userRole === "Gerente") {
        if (branch.manager.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para desactivar este concepto",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para desactivar este concepto",
        });
      }
    }

    const expenseConcept = await ExpenseConcept.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "companyName");

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
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que el concepto existe
    const existingConcept = await ExpenseConcept.findById(
      req.params.id
    ).populate("branch");

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      const branch = await Branch.findById(existingConcept.branch._id);

      if (userRole === "Administrador") {
        if (branch.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para activar este concepto",
          });
        }
      } else if (userRole === "Gerente") {
        if (branch.manager.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para activar este concepto",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para activar este concepto",
        });
      }
    }

    const expenseConcept = await ExpenseConcept.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )
      .populate("branch", "branchName branchCode")
      .populate("company", "companyName");

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
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que el concepto existe
    const existingConcept = await ExpenseConcept.findById(
      req.params.id
    ).populate("branch");

    if (!existingConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      const branch = await Branch.findById(existingConcept.branch._id);

      if (userRole === "Administrador") {
        if (branch.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar este concepto",
          });
        }
      } else if (userRole === "Gerente") {
        if (branch.manager.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar este concepto",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para eliminar este concepto",
        });
      }
    }

    const expenseConcept = await ExpenseConcept.findByIdAndDelete(
      req.params.id
    );

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
