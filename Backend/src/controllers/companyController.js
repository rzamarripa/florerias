import { Company } from "../models/Company.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";
import { Role } from "../models/Roles.js";

// Crear nueva empresa
export const createCompany = async (req, res) => {
  try {
    const {
      legalName,
      tradeName,
      rfc,
      legalForm,
      fiscalAddress,
      primaryContact,
      administratorId,
      administratorData,
    } = req.body;

    // Verificar si ya existe una empresa con el mismo RFC
    const existingCompany = await Company.findOne({ rfc });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una empresa con este RFC",
      });
    }

    let finalAdministratorId = administratorId;

    // Si no se proporciona administratorId, crear un nuevo usuario administrador
    if (!administratorId && administratorData) {
      // Buscar el rol de Administrador
      const adminRole = await Role.findOne({ name: /^Administrador$/i });
      if (!adminRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Administrador",
        });
      }

      // Verificar que no exista un usuario con el mismo username o email (case-insensitive)
      const existingUser = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${administratorData.username}$`, 'i') } },
          { email: { $regex: new RegExp(`^${administratorData.email}$`, 'i') } },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username.toLowerCase() === administratorData.username.toLowerCase()
              ? "Ya existe un usuario con este nombre de usuario"
              : "Ya existe un usuario con este email",
        });
      }

      // Crear el nuevo usuario administrador
      const newAdmin = await User.create({
        username: administratorData.username,
        email: administratorData.email,
        phone: administratorData.phone,
        password: administratorData.password,
        profile: {
          name: administratorData.profile.name,
          lastName: administratorData.profile.lastName,
          fullName: `${administratorData.profile.name} ${administratorData.profile.lastName}`,
          estatus: true,
        },
        role: adminRole._id,
      });

      finalAdministratorId = newAdmin._id;
    } else if (administratorId) {
      // Verificar que el usuario existe y tiene rol de administrador
      const adminUser = await User.findById(administratorId).populate("role");
      if (!adminUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario administrador no encontrado",
        });
      }

      if (!adminUser.role || adminUser.role.name !== "Administrador") {
        return res.status(400).json({
          success: false,
          message: "El usuario seleccionado no tiene el rol de Administrador",
        });
      }

      // Verificar que el administrador no esté asignado a otra empresa
      const existingCompanyWithAdmin = await Company.findOne({
        administrator: administratorId,
      });

      if (existingCompanyWithAdmin) {
        return res.status(400).json({
          success: false,
          message: "El usuario administrador ya tiene una empresa asignada",
        });
      }
    }

    const company = await Company.create({
      legalName,
      tradeName,
      rfc,
      legalForm,
      fiscalAddress,
      primaryContact,
      administrator: finalAdministratorId,
    });

    // Popular el distribuidor para la respuesta
    await company.populate("administrator", "username email phone profile");

    res.status(201).json({
      success: true,
      message: "Empresa creada exitosamente",
      data: company,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una empresa con este RFC",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todas las empresas
export const getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.search) {
      filters.$or = [
        { legalName: { $regex: req.query.search, $options: "i" } },
        { tradeName: { $regex: req.query.search, $options: "i" } },
        { rfc: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const companies = await Company.find(filters)
      .populate("branches", "branchName branchCode isActive")
      .populate("administrator", "username email profile.name profile.lastName profile.fullName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: companies.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener empresa por ID
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate("branches", "branchName branchCode address isActive")
      .populate("administrator", "username email phone profile");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar empresa
export const updateCompany = async (req, res) => {
  try {
    const {
      legalName,
      tradeName,
      rfc,
      legalForm,
      fiscalAddress,
      primaryContact,
      administratorId,
      administratorData,
    } = req.body;

    // Si se está actualizando el RFC, verificar que no exista en otra empresa
    if (rfc) {
      const existingCompany = await Company.findOne({
        rfc,
        _id: { $ne: req.params.id },
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otra empresa con este RFC",
        });
      }
    }

    const updateData = {};
    if (legalName) updateData.legalName = legalName;
    if (tradeName !== undefined) updateData.tradeName = tradeName;
    if (rfc) updateData.rfc = rfc;
    if (legalForm) updateData.legalForm = legalForm;
    if (fiscalAddress) updateData.fiscalAddress = fiscalAddress;
    if (primaryContact) updateData.primaryContact = primaryContact;

    // Manejar actualización del distribuidor
    if (administratorId !== undefined) {
      if (administratorId === null || administratorId === "") {
        // Si se pasa null o string vacío, remover el distribuidor
        updateData.distributor = null;
      } else {
        // Verificar que el usuario existe y tiene rol de administrador
        const adminUser = await User.findById(administratorId).populate("role");
        if (!adminUser) {
          return res.status(404).json({
            success: false,
            message: "Usuario administrador no encontrado",
          });
        }

        if (!adminUser.role || adminUser.role.name !== "Administrador") {
          return res.status(400).json({
            success: false,
            message:
              "El usuario seleccionado no tiene el rol de Administrador",
          });
        }

        // Verificar que el administrador no esté asignado a otra empresa (excepto la actual)
        const existingCompanyWithAdmin = await Company.findOne({
          administrator: administratorId,
          _id: { $ne: req.params.id },
        });

        if (existingCompanyWithAdmin) {
          return res.status(400).json({
            success: false,
            message: "El usuario administrador ya tiene una empresa asignada",
          });
        }

        updateData.administrator = administratorId;
      }
    } else if (administratorData) {
      // Crear nuevo administrador si se proporcionan datos
      const adminRole = await Role.findOne({ name: /^Administrador$/i });
      if (!adminRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Administrador",
        });
      }

      // Verificar que no exista un usuario con el mismo username o email (case-insensitive)
      const existingUser = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${administratorData.username}$`, 'i') } },
          { email: { $regex: new RegExp(`^${administratorData.email}$`, 'i') } },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username.toLowerCase() === administratorData.username.toLowerCase()
              ? "Ya existe un usuario con este nombre de usuario"
              : "Ya existe un usuario con este email",
        });
      }

      const newAdmin = await User.create({
        username: administratorData.username,
        email: administratorData.email,
        phone: administratorData.phone,
        password: administratorData.password,
        profile: {
          name: administratorData.profile.name,
          lastName: administratorData.profile.lastName,
          fullName: `${administratorData.profile.name} ${administratorData.profile.lastName}`,
          estatus: true,
        },
        role: adminRole._id,
      });

      updateData.distributor = newAdmin._id;
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("branches", "branchName branchCode isActive")
      .populate("administrator", "username email phone profile");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Empresa actualizada exitosamente",
      data: company,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una empresa con este RFC",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar empresa
export const deactivateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate("branches", "branchName branchCode isActive")
      .populate("administrator", "username email profile");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Empresa desactivada exitosamente",
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar empresa
export const activateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )
      .populate("branches", "branchName branchCode isActive")
      .populate("administrator", "username email profile");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Empresa activada exitosamente",
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar empresa (físicamente)
export const deleteCompany = async (req, res) => {
  try {
    // Verificar si tiene sucursales asociadas
    const branchCount = await Branch.countDocuments({
      companyId: req.params.id,
    });

    if (branchCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la empresa porque tiene ${branchCount} sucursal(es) asociada(s). Primero elimine las sucursales.`,
      });
    }

    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Empresa eliminada exitosamente",
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener usuarios con rol Administrador activos
export const getAdministrators = async (req, res) => {
  try {
    const adminRole = await Role.findOne({ name: /^Administrador$/i });

    if (!adminRole) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el rol de Administrador",
      });
    }

    const administrators = await User.find({
      role: adminRole._id,
      "profile.estatus": true,
    }).select("username email phone profile");

    res.status(200).json({
      success: true,
      count: administrators.length,
      data: administrators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar sucursales de una empresa
export const updateCompanyBranches = async (req, res) => {
  try {
    const { branchIds } = req.body;

    // Validación: Solo usuarios con rol Administrador o Super Admin pueden asignar sucursales
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
    const isAdmin = userRole === "Administrador" || userRole === "Super Admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Solo usuarios con rol Administrador o Super Admin pueden asignar sucursales a empresas",
      });
    }

    if (!branchIds || !Array.isArray(branchIds)) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de IDs de sucursales",
      });
    }

    // Verificar que la empresa existe
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    // Verificar que todas las sucursales existen
    if (branchIds.length > 0) {
      const branchCount = await Branch.countDocuments({
        _id: { $in: branchIds },
      });

      if (branchCount !== branchIds.length) {
        return res.status(400).json({
          success: false,
          message: "Una o más sucursales no existen",
        });
      }
    }

    // Actualizar el array de branches
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { branches: branchIds },
      { new: true, runValidators: true }
    )
      .populate("administrator", "username email profile")
      .populate({
        path: "branches",
        select: "branchName branchCode address manager contactPhone contactEmail isActive",
      });

    res.status(200).json({
      success: true,
      message: "Sucursales actualizadas exitosamente",
      data: updatedCompany,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
