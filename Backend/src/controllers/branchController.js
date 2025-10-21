import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { Role } from "../models/Roles.js";

// Crear nueva sucursal
export const createBranch = async (req, res) => {
  try {
    const {
      branchName,
      branchCode,
      companyId,
      address,
      managerId,
      managerData,
      contactPhone,
      contactEmail,
      employees,
    } = req.body;


    // Validar que el usuario en sesión tiene rol de Administrador
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const currentUser = await User.findById(req.user._id).populate("role");
    if (!currentUser || !currentUser.role || currentUser.role.name !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "Solo usuarios administradores pueden crear sucursales",
      });
    }

    // Validar que companyId esté presente y no sea vacío
    if (!companyId || companyId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El ID de la empresa es requerido",
      });
    }

    // Verificar que la empresa existe
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    // Verificar que el branchCode sea único si se proporciona
    if (branchCode) {
      const existingBranch = await Branch.findOne({ branchCode });
      if (existingBranch) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una sucursal con este código",
        });
      }
    }

    let finalManagerId = managerId;

    // Si no se proporciona managerId, crear un nuevo usuario gerente
    if (!managerId && managerData) {
      // Buscar el rol de Gerente
      const managerRole = await Role.findOne({ name: /^Gerente$/i });
      if (!managerRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Gerente",
        });
      }

      // Verificar que no exista un usuario con el mismo username o email (case-insensitive)
      const existingUser = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${managerData.username}$`, 'i') } },
          { email: { $regex: new RegExp(`^${managerData.email}$`, 'i') } },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username.toLowerCase() === managerData.username.toLowerCase()
              ? "Ya existe un usuario con este nombre de usuario"
              : "Ya existe un usuario con este email",
        });
      }

      // Crear el nuevo usuario gerente
      const newManager = await User.create({
        username: managerData.username,
        email: managerData.email,
        phone: managerData.phone,
        password: managerData.password,
        profile: {
          name: managerData.profile.name,
          lastName: managerData.profile.lastName,
          fullName: `${managerData.profile.name} ${managerData.profile.lastName}`,
          estatus: true,
        },
        role: managerRole._id,
      });

      finalManagerId = newManager._id;
    } else if (managerId) {
      // Verificar que el usuario existe y tiene rol de gerente
      const managerUser = await User.findById(managerId).populate("role");
      if (!managerUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario gerente no encontrado",
        });
      }

      if (!managerUser.role || managerUser.role.name !== "Gerente") {
        return res.status(400).json({
          success: false,
          message: "El usuario seleccionado no tiene el rol de Gerente",
        });
      }

      // Verificar que el gerente no esté asignado a otra sucursal
      const existingBranchWithManager = await Branch.findOne({
        manager: managerId,
      });

      if (existingBranchWithManager) {
        return res.status(400).json({
          success: false,
          message: "El usuario gerente ya tiene una sucursal asignada",
        });
      }
    }

    // Verificar que los empleados existen
    if (employees && employees.length > 0) {
      const employeeCount = await User.countDocuments({
        _id: { $in: employees },
      });
      if (employeeCount !== employees.length) {
        return res.status(400).json({
          success: false,
          message: "Uno o más empleados no existen",
        });
      }
    }

    const branch = await Branch.create({
      branchName,
      branchCode,
      companyId,
      administrator: req.user._id, // El usuario en sesión que crea la sucursal
      address,
      manager: finalManagerId,
      contactPhone,
      contactEmail,
      employees: employees || [],
    });

    // Agregar la sucursal al array de branches de la empresa
    await Company.findByIdAndUpdate(companyId, {
      $push: { branches: branch._id },
    });

    // Popular los datos para la respuesta
    await branch.populate("companyId", "legalName tradeName rfc");
    await branch.populate("administrator", "username email profile");
    await branch.populate("manager", "username email profile");
    await branch.populate("employees", "username email profile");

    res.status(201).json({
      success: true,
      message: "Sucursal creada exitosamente",
      data: branch,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una sucursal con este código",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todas las sucursales
export const getAllBranches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    // Validar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(req.user._id).populate("role");
    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario no tiene rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // CASO 1: Si es Super Admin, puede ver todas o filtrar
    if (userRole === "Super Admin") {
      // Si envía companyId como filtro, aplicarlo (opcional para Super Admin)
      if (req.query.companyId) {
        filters.companyId = req.query.companyId;
      }
      // Si no envía filtro, verá todas las sucursales del sistema
    }
    // CASO 2: Si el usuario tiene rol "Administrador" (administrador de empresa)
    else if (userRole === "Administrador") {
      // Filtrar directamente por el campo administrator de la sucursal
      filters.administrator = req.user._id;
    }
    // CASO 3: Si el usuario es Gerente
    else if (userRole === "Gerente") {
      // Buscar la sucursal donde el usuario es el gerente
      filters.manager = req.user._id;
    }
    // CASO 4: Otros roles no tienen acceso
    else {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver sucursales",
      });
    }

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.search) {
      filters.$or = [
        { branchName: { $regex: req.query.search, $options: "i" } },
        { branchCode: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const branches = await Branch.find(filters)
      .populate("companyId", "legalName tradeName rfc isActive")
      .populate("administrator", "username email profile.name profile.lastName profile.fullName")
      .populate("manager", "username email phone profile.name profile.lastName profile.fullName")
      .populate({
        path: "employees",
        select: "username email phone profile.name profile.lastName profile.fullName role",
        populate: {
          path: "role",
          select: "name"
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Branch.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: branches.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener sucursal por ID
export const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate("companyId", "legalName tradeName rfc fiscalAddress isActive")
      .populate("administrator", "username email phone profile.name profile.lastName profile.fullName")
      .populate("manager", "username email phone profile.name profile.lastName profile.fullName")
      .populate({
        path: "employees",
        select: "username email phone profile.name profile.lastName profile.fullName role",
        populate: {
          path: "role",
          select: "name"
        }
      });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar sucursal
export const updateBranch = async (req, res) => {
  try {
    const {
      branchName,
      branchCode,
      address,
      managerId,
      managerData,
      contactPhone,
      contactEmail,
      employees,
    } = req.body;

    // Si se está actualizando el branchCode, verificar que no exista en otra sucursal
    if (branchCode) {
      const existingBranch = await Branch.findOne({
        branchCode,
        _id: { $ne: req.params.id },
      });

      if (existingBranch) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otra sucursal con este código",
        });
      }
    }

    const updateData = {};
    if (branchName) updateData.branchName = branchName;
    if (branchCode !== undefined) updateData.branchCode = branchCode;
    if (address) updateData.address = address;
    if (contactPhone) updateData.contactPhone = contactPhone;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (employees !== undefined) updateData.employees = employees;

    // Manejar actualización del gerente
    if (managerId !== undefined) {
      if (managerId === null || managerId === "") {
        // Si se pasa null o string vacío, remover el gerente
        updateData.manager = null;
      } else {
        // Verificar que el usuario existe y tiene rol de gerente
        const managerUser = await User.findById(managerId).populate("role");
        if (!managerUser) {
          return res.status(404).json({
            success: false,
            message: "Usuario gerente no encontrado",
          });
        }

        if (!managerUser.role || managerUser.role.name !== "Gerente") {
          return res.status(400).json({
            success: false,
            message: "El usuario seleccionado no tiene el rol de Gerente",
          });
        }

        // Verificar que el gerente no esté asignado a otra sucursal (excepto la actual)
        const existingBranchWithManager = await Branch.findOne({
          manager: managerId,
          _id: { $ne: req.params.id },
        });

        if (existingBranchWithManager) {
          return res.status(400).json({
            success: false,
            message: "El usuario gerente ya tiene una sucursal asignada",
          });
        }

        updateData.manager = managerId;
      }
    } else if (managerData) {
      // Crear nuevo gerente si se proporcionan datos
      const managerRole = await Role.findOne({ name: /^Gerente$/i });
      if (!managerRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Gerente",
        });
      }

      // Verificar que no exista un usuario con el mismo username o email (case-insensitive)
      const existingUser = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${managerData.username}$`, 'i') } },
          { email: { $regex: new RegExp(`^${managerData.email}$`, 'i') } },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username.toLowerCase() === managerData.username.toLowerCase()
              ? "Ya existe un usuario con este nombre de usuario"
              : "Ya existe un usuario con este email",
        });
      }

      const newManager = await User.create({
        username: managerData.username,
        email: managerData.email,
        phone: managerData.phone,
        password: managerData.password,
        profile: {
          name: managerData.profile.name,
          lastName: managerData.profile.lastName,
          fullName: `${managerData.profile.name} ${managerData.profile.lastName}`,
          estatus: true,
        },
        role: managerRole._id,
      });

      updateData.manager = newManager._id;
    }

    // Verificar que los empleados existen si se proporcionan
    if (employees && employees.length > 0) {
      const employeeCount = await User.countDocuments({
        _id: { $in: employees },
      });
      if (employeeCount !== employees.length) {
        return res.status(400).json({
          success: false,
          message: "Uno o más empleados no existen",
        });
      }
    }

    const branch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("companyId", "legalName tradeName rfc")
      .populate("manager", "username email profile")
      .populate("employees", "username email profile.name profile.lastName");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sucursal actualizada exitosamente",
      data: branch,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una sucursal con este código",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar sucursal
export const deactivateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate("companyId", "legalName tradeName")
      .populate("employees", "username email");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sucursal desactivada exitosamente",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar sucursal
export const activateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )
      .populate("companyId", "legalName tradeName")
      .populate("employees", "username email");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sucursal activada exitosamente",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar sucursal (físicamente)
export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Eliminar la referencia de la sucursal en la empresa
    await Company.findByIdAndUpdate(branch.companyId, {
      $pull: { branches: branch._id },
    });

    await Branch.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Sucursal eliminada exitosamente",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Agregar empleados a una sucursal
export const addEmployeesToBranch = async (req, res) => {
  try {
    const { employeeIds, employeesData } = req.body;

    let createdEmployeeIds = [];

    // CASO 1: Crear nuevos empleados desde employeesData
    if (employeesData && Array.isArray(employeesData) && employeesData.length > 0) {
      // Crear cada empleado
      for (const empData of employeesData) {
        // Validar que el rol esté presente
        if (!empData.role) {
          return res.status(400).json({
            success: false,
            message: "El rol es requerido para cada empleado",
          });
        }

        // Verificar que el rol existe
        const selectedRole = await Role.findById(empData.role);
        if (!selectedRole) {
          return res.status(400).json({
            success: false,
            message: `El rol especificado no existe`,
          });
        }

        // Verificar que no exista un usuario con el mismo username o email
        const existingUser = await User.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${empData.username}$`, 'i') } },
            { email: { $regex: new RegExp(`^${empData.email}$`, 'i') } },
          ],
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message:
              existingUser.username.toLowerCase() === empData.username.toLowerCase()
                ? `Ya existe un usuario con el nombre de usuario "${empData.username}"`
                : `Ya existe un usuario con el email "${empData.email}"`,
          });
        }

        // Crear el empleado con el rol seleccionado desde el frontend
        const newEmployee = await User.create({
          username: empData.username,
          email: empData.email,
          phone: empData.phone,
          password: empData.password,
          profile: {
            name: empData.profile.name,
            lastName: empData.profile.lastName,
            fullName: `${empData.profile.name} ${empData.profile.lastName}`,
            estatus: true,
          },
          role: empData.role, // Usar el rol seleccionado desde el frontend
        });

        createdEmployeeIds.push(newEmployee._id);
      }
    }

    // CASO 2: Agregar empleados existentes por IDs
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      // Verificar que los empleados existen
      const employeeCount = await User.countDocuments({
        _id: { $in: employeeIds },
      });

      if (employeeCount !== employeeIds.length) {
        return res.status(400).json({
          success: false,
          message: "Uno o más empleados no existen",
        });
      }

      createdEmployeeIds = [...createdEmployeeIds, ...employeeIds];
    }

    // Validar que se hayan proporcionado empleados
    if (createdEmployeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere al menos un empleado para agregar (employeeIds o employeesData)",
      });
    }

    // Actualizar la sucursal agregando los empleados
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { employees: { $each: createdEmployeeIds } } },
      { new: true }
    )
      .populate("companyId", "legalName tradeName")
      .populate("employees", "username email profile.name profile.lastName");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Empleados agregados exitosamente",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remover empleado de una sucursal
export const removeEmployeeFromBranch = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $pull: { employees: employeeId } },
      { new: true }
    )
      .populate("companyId", "legalName tradeName")
      .populate("employees", "username email profile.name profile.lastName");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Empleado removido exitosamente",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener usuarios con rol Gerente activos que no tengan sucursal asignada
export const getAvailableManagers = async (req, res) => {
  try {
    const managerRole = await Role.findOne({ name: /^Gerente$/i });

    // Si no existe el rol, retornar lista vacía con mensaje
    if (!managerRole) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No se encontró el rol de Gerente en el sistema. Por favor, crea el rol primero.",
      });
    }

    // Obtener IDs de gerentes que ya tienen sucursal asignada
    const branchesWithManagers = await Branch.find({ manager: { $ne: null } }).select("manager");
    const assignedManagerIds = branchesWithManagers.map(b => b.manager);

    // Buscar gerentes activos que NO estén en la lista de asignados
    const availableManagers = await User.find({
      role: managerRole._id,
      "profile.estatus": true,
      _id: { $nin: assignedManagerIds },
    }).select("username email phone profile");

    res.status(200).json({
      success: true,
      count: availableManagers.length,
      data: availableManagers,
      message: availableManagers.length === 0 ? "No hay gerentes disponibles. Todos están asignados a sucursales." : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener sucursales del usuario actual
export const getUserBranches = async (req, res) => {
  try {
    // Obtener el ID del usuario desde el token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el usuario con su rol
    const user = await User.findById(userId).populate("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    let branches = [];

    // Buscar los roles de Administrador y Gerente
    const adminRole = await Role.findOne({ name: /^Administrador$/i });
    const managerRole = await Role.findOne({ name: /^Gerente$/i });

    // Si el usuario es Administrador, buscar sucursales donde es administrator
    if (adminRole && user.role && user.role._id.toString() === adminRole._id.toString()) {
      console.log('getUserBranches - Buscando sucursales donde administrator =', userId);
      branches = await Branch.find({
        administrator: userId,
        isActive: true,
      })
        .populate("companyId", "legalName tradeName")
        .select("branchName branchCode address companyId");
      console.log('getUserBranches - Sucursales encontradas (Admin):', branches.length);
    }
    // Si el usuario es gerente, buscar sucursales donde es manager
    else if (managerRole && user.role && user.role._id.toString() === managerRole._id.toString()) {
      console.log('getUserBranches - Buscando sucursales donde manager =', userId);
      branches = await Branch.find({
        manager: userId,
        isActive: true,
      })
        .populate("companyId", "legalName tradeName")
        .select("branchName branchCode address companyId");
      console.log('getUserBranches - Sucursales encontradas (Manager):', branches.length);
    }
    // Si no es ni administrador ni gerente, buscar sucursales donde está en el array de employees
    else {
      console.log('getUserBranches - Buscando sucursales donde employees contiene', userId);
      branches = await Branch.find({
        employees: userId,
        isActive: true,
      })
        .populate("companyId", "legalName tradeName")
        .select("branchName branchCode address companyId");
      console.log('getUserBranches - Sucursales encontradas (Employee):', branches.length);
    }

    console.log('getUserBranches - Respuesta final:', { count: branches.length, data: branches.map(b => b.branchName) });

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    console.error("Error al obtener sucursales del usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};
