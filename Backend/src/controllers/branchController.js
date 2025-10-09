import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";

// Crear nueva sucursal
export const createBranch = async (req, res) => {
  try {
    const {
      branchName,
      branchCode,
      companyId,
      address,
      manager,
      contactPhone,
      contactEmail,
      employees,
    } = req.body;

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
      address,
      manager,
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

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.companyId) {
      filters.companyId = req.query.companyId;
    }

    if (req.query.search) {
      filters.$or = [
        { branchName: { $regex: req.query.search, $options: "i" } },
        { branchCode: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const branches = await Branch.find(filters)
      .populate("companyId", "legalName tradeName rfc isActive")
      .populate("manager", "username email profile.name profile.lastName profile.fullName")
      .populate("employees", "username email profile.name profile.lastName")
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
      .populate("manager", "username email phone profile.name profile.lastName profile.fullName")
      .populate(
        "employees",
        "username email phone profile.name profile.lastName profile.fullName"
      );

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
      manager,
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

    const updateData = {};
    if (branchName) updateData.branchName = branchName;
    if (branchCode !== undefined) updateData.branchCode = branchCode;
    if (address) updateData.address = address;
    if (manager) updateData.manager = manager;
    if (contactPhone) updateData.contactPhone = contactPhone;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (employees !== undefined) updateData.employees = employees;

    const branch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("companyId", "legalName tradeName rfc")
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
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de IDs de empleados",
      });
    }

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

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { employees: { $each: employeeIds } } },
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
