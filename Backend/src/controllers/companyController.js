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
      redesIds,
      isFranchise,
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

    // Obtener el distribuidor desde la sesión del usuario autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Validar usuarios de redes si se proporcionan
    let validatedRedesIds = [];
    if (redesIds && Array.isArray(redesIds) && redesIds.length > 0) {
      // Buscar el rol de Redes
      const redesRole = await Role.findOne({ name: /^Redes$/i });
      if (!redesRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Redes",
        });
      }

      // Verificar que todos los usuarios existen y tienen rol de Redes
      const redesUsers = await User.find({
        _id: { $in: redesIds },
        role: redesRole._id,
      });

      if (redesUsers.length !== redesIds.length) {
        return res.status(400).json({
          success: false,
          message: "Uno o más usuarios no existen o no tienen el rol de Redes",
        });
      }

      validatedRedesIds = redesIds;
    }

    const company = await Company.create({
      legalName,
      tradeName,
      rfc,
      legalForm,
      fiscalAddress,
      primaryContact,
      administrator: finalAdministratorId,
      distributor: req.user._id,
      redes: validatedRedesIds,
      isFranchise: isFranchise || false,
    });

    // Popular el distribuidor, administrador y redes para la respuesta
    await company.populate("administrator", "username email phone profile");
    await company.populate("distributor", "username email profile");
    await company.populate("redes", "username email phone profile");

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
      // Super Admin puede ver todas las empresas (no se agrega filtro)
    } else if (userRole === "Administrador") {
      // Administrador solo ve las empresas donde es el administrator
      filters.administrator = req.user._id;
    } else {
      // Distribuidor u otros roles solo ven las empresas donde son distributor
      filters.distributor = req.user._id;
    }

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
      .populate("distributor", "username email profile.name profile.lastName profile.fullName")
      .populate("redes", "username email profile.name profile.lastName profile.fullName")
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

    // Construir filtros
    const filters = { _id: req.params.id };

    // Filtrado por rol
    if (userRole === "Super Admin") {
      // Super Admin puede ver todas las empresas (no se agrega filtro adicional)
    } else if (userRole === "Administrador") {
      // Administrador solo ve las empresas donde es el administrator
      filters.administrator = req.user._id;
    } else {
      // Distribuidor u otros roles solo ven las empresas donde son distributor
      filters.distributor = req.user._id;
    }

    const company = await Company.findOne(filters)
      .populate("branches", "branchName branchCode address isActive")
      .populate("administrator", "username email phone profile")
      .populate("distributor", "username email profile")
      .populate("redes", "username email phone profile");

    console.log('company', company)

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

    // Verificar que la empresa pertenezca al usuario (excepto Super Admin)
    if (userRole !== "Super Admin") {
      const filters = { _id: req.params.id };

      if (userRole === "Administrador") {
        // Administrador solo puede actualizar empresas donde es el administrator
        filters.administrator = req.user._id;
      } else {
        // Distribuidor u otros roles solo pueden actualizar empresas donde son distributor
        filters.distributor = req.user._id;
      }

      const existingCompany = await Company.findOne(filters);

      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: "Empresa no encontrada o no tienes permisos para actualizarla",
        });
      }
    }

    const {
      legalName,
      tradeName,
      rfc,
      legalForm,
      fiscalAddress,
      primaryContact,
      administratorId,
      administratorData,
      redesIds,
      isFranchise,
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
    if (isFranchise !== undefined) updateData.isFranchise = isFranchise;

    // Manejar actualización de logo
    if (req.body.logoUrl !== undefined) updateData.logoUrl = req.body.logoUrl;
    if (req.body.logoPath !== undefined) updateData.logoPath = req.body.logoPath;

    // Manejar actualización del administrador
    if (administratorId !== undefined) {
      if (administratorId === null || administratorId === "") {
        // Si se pasa null o string vacío, remover el administrador
        updateData.administrator = null;
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

      updateData.administrator = newAdmin._id;
    }

    // Manejar creación o actualización de usuario redes si se proporcionan datos
    let newRedesUserId = null;
    if (req.body.redesUserData) {
      const { redesUserData } = req.body;

      // Buscar el rol de Redes
      const redesRole = await Role.findOne({ name: /^Redes$/i });
      if (!redesRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Redes",
        });
      }

      // Si se proporciona redesIds (usuario existente), actualizar el usuario
      if (redesIds && Array.isArray(redesIds) && redesIds.length > 0) {
        const redesUserId = redesIds[0]; // Tomamos el primer ID (solo hay uno en el modal)

        // Verificar que el usuario existe
        const existingRedesUser = await User.findById(redesUserId);
        if (!existingRedesUser) {
          return res.status(404).json({
            success: false,
            message: "Usuario redes no encontrado",
          });
        }

        // Verificar que no exista otro usuario con el mismo username o email (case-insensitive)
        // excepto el usuario actual
        const duplicateUser = await User.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${redesUserData.username}$`, 'i') } },
            { email: { $regex: new RegExp(`^${redesUserData.email}$`, 'i') } },
          ],
          _id: { $ne: redesUserId },
        });

        if (duplicateUser) {
          return res.status(400).json({
            success: false,
            message:
              duplicateUser.username.toLowerCase() === redesUserData.username.toLowerCase()
                ? "Ya existe un usuario con este nombre de usuario"
                : "Ya existe un usuario con este email",
          });
        }

        // Preparar datos de actualización
        const redesUpdateData = {
          username: redesUserData.username,
          email: redesUserData.email,
          phone: redesUserData.phone,
          profile: {
            name: redesUserData.profile.name,
            lastName: redesUserData.profile.lastName,
            fullName: `${redesUserData.profile.name} ${redesUserData.profile.lastName}`,
            estatus: existingRedesUser.profile.estatus, // Mantener el estado actual
          },
        };

        // Solo actualizar contraseña si se proporciona
        if (redesUserData.password && redesUserData.password.trim() !== "") {
          redesUpdateData.password = redesUserData.password;
        }

        // Actualizar el usuario redes
        await User.findByIdAndUpdate(
          redesUserId,
          redesUpdateData,
          { new: true, runValidators: true }
        );

        // No necesitamos crear nuevo ID, usamos el existente
      } else {
        // Si no hay redesIds, crear un nuevo usuario redes
        // Verificar que no exista un usuario con el mismo username o email (case-insensitive)
        const existingUser = await User.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${redesUserData.username}$`, 'i') } },
            { email: { $regex: new RegExp(`^${redesUserData.email}$`, 'i') } },
          ],
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message:
              existingUser.username.toLowerCase() === redesUserData.username.toLowerCase()
                ? "Ya existe un usuario con este nombre de usuario"
                : "Ya existe un usuario con este email",
          });
        }

        // Crear el nuevo usuario redes
        const newRedesUser = await User.create({
          username: redesUserData.username,
          email: redesUserData.email,
          phone: redesUserData.phone,
          password: redesUserData.password,
          profile: {
            name: redesUserData.profile.name,
            lastName: redesUserData.profile.lastName,
            fullName: `${redesUserData.profile.name} ${redesUserData.profile.lastName}`,
            estatus: true,
          },
          role: redesRole._id,
        });

        newRedesUserId = newRedesUser._id;
      }
    }

    // Manejar actualización de usuarios redes
    if (redesIds !== undefined || newRedesUserId) {
      let finalRedesIds = [];

      if (Array.isArray(redesIds) && redesIds.length > 0) {
        // Buscar el rol de Redes
        const redesRole = await Role.findOne({ name: /^Redes$/i });
        if (!redesRole) {
          return res.status(400).json({
            success: false,
            message: "No se encontró el rol de Redes",
          });
        }

        // Verificar que todos los usuarios existen y tienen rol de Redes
        const redesUsers = await User.find({
          _id: { $in: redesIds },
          role: redesRole._id,
        });

        if (redesUsers.length !== redesIds.length) {
          return res.status(400).json({
            success: false,
            message: "Uno o más usuarios no existen o no tienen el rol de Redes",
          });
        }

        finalRedesIds = redesIds;
      }

      // Agregar el nuevo usuario redes creado si existe
      if (newRedesUserId) {
        finalRedesIds.push(newRedesUserId);
      }

      updateData.redes = finalRedesIds;
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
      .populate("administrator", "username email phone profile")
      .populate("redes", "username email phone profile");

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

// Obtener usuarios con rol Administrador activos sin empresa asignada
export const getAdministrators = async (req, res) => {
  try {
    const adminRole = await Role.findOne({ name: /^Administrador$/i });

    if (!adminRole) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el rol de Administrador",
      });
    }

    // Obtener todos los usuarios con rol Administrador activos
    const allAdministrators = await User.find({
      role: adminRole._id,
      "profile.estatus": true,
    }).select("username email phone profile");

    // Obtener IDs de administradores que ya tienen empresa asignada
    const companiesWithAdmin = await Company.find({
      administrator: { $ne: null }
    }).select("administrator");

    const assignedAdminIds = companiesWithAdmin.map(c => c.administrator.toString());

    // Si se está editando una empresa (companyId en query), incluir también su administrador actual
    const companyId = req.query.companyId;
    let currentCompanyAdminId = null;

    if (companyId) {
      const company = await Company.findById(companyId).select("administrator");
      if (company && company.administrator) {
        currentCompanyAdminId = company.administrator.toString();
      }
    }

    // Filtrar administradores sin empresa asignada
    // O el administrador actual de la empresa que se está editando
    const availableAdministrators = allAdministrators.filter(
      admin => {
        const adminId = admin._id.toString();
        return !assignedAdminIds.includes(adminId) || adminId === currentCompanyAdminId;
      }
    );

    res.status(200).json({
      success: true,
      count: availableAdministrators.length,
      data: availableAdministrators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener usuarios con rol Redes activos
export const getRedesUsers = async (req, res) => {
  try {
    const redesRole = await Role.findOne({ name: /^Redes$/i });

    if (!redesRole) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el rol de Redes",
      });
    }

    const redesUsers = await User.find({
      role: redesRole._id,
      "profile.estatus": true,
    }).select("username email phone profile");

    res.status(200).json({
      success: true,
      count: redesUsers.length,
      data: redesUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener sucursales de la empresa del usuario Redes autenticado
export const getRedesUserBranches = async (req, res) => {
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

    // Solo usuarios con rol "Redes" pueden usar este endpoint
    if (userRole !== "Redes") {
      return res.status(403).json({
        success: false,
        message: "Solo usuarios con rol Redes pueden acceder a este recurso",
      });
    }

    // Buscar la empresa donde el usuario autenticado está en el array de redes
    const company = await Company.findOne({ redes: req.user._id })
      .populate({
        path: "branches",
        match: { isActive: true }, // Solo sucursales activas
        select: "branchName branchCode address isActive",
      });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una empresa asignada a tu usuario",
      });
    }

    // Retornar solo las sucursales
    res.status(200).json({
      success: true,
      count: company.branches ? company.branches.length : 0,
      data: company.branches || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener la empresa del usuario administrador autenticado
export const getMyCompany = async (req, res) => {
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

    // Solo usuarios con rol "Administrador" pueden usar este endpoint
    if (userRole !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "Solo usuarios con rol Administrador pueden acceder a este recurso",
      });
    }

    // Buscar la empresa donde el usuario autenticado es el administrador
    const company = await Company.findOne({ administrator: req.user._id })
      .select("+isFranchise") // Asegurar que se incluya el campo isFranchise
      .populate("branches", "branchName branchCode address isActive")
      .populate("administrator", "username email phone profile")
      .populate("distributor", "username email profile");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una empresa asignada a tu usuario",
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

// Obtener datos de empresa por ID de sucursal (para tickets de venta)
export const getCompanyByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Buscar la sucursal
    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Buscar la empresa asociada a la sucursal
    const company = await Company.findById(branch.companyId).select(
      "legalName tradeName rfc fiscalAddress primaryContact logoUrl logoPath"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    // Construir la respuesta con los datos necesarios para el ticket
    const ticketData = {
      companyId: company._id, // Agregado para Firebase Storage
      companyName: company.tradeName || company.legalName,
      rfc: company.rfc,
      address: {
        street: branch.address.street,
        externalNumber: branch.address.externalNumber,
        internalNumber: branch.address.internalNumber || "",
        neighborhood: branch.address.neighborhood,
        city: branch.address.city,
        state: branch.address.state,
        postalCode: branch.address.postalCode,
      },
      phone: branch.contactPhone,
      email: branch.contactEmail,
      branchName: branch.branchName,
      logoUrl: company.logoUrl || null,
      logoPath: company.logoPath || null,
    };

    res.status(200).json({
      success: true,
      data: ticketData,
    });
  } catch (error) {
    console.error("Error al obtener datos de empresa por sucursal:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener datos de la empresa",
    });
  }
};

// Obtener empresa por ID del administrador
export const getCompanyByAdministratorId = async (req, res) => {
  try {
    const { administratorId } = req.params;

    const company = await Company.findOne({ administrator: administratorId })
      .populate("branches", "branchName _id")
      .select("_id legalName tradeName rfc");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una empresa para este administrador",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error al obtener empresa por administrador:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener la empresa",
    });
  }
};

// Obtener la empresa del usuario autenticado (Administrador o Gerente)
export const getUserCompany = async (req, res) => {
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
    let company = null;

    // Si es Administrador, buscar en cv_companies por el campo administrator
    // o en cv_branches por el campo administrator
    if (userRole === "Administrador") {
      // Primero intentar buscar en Company.administrator
      company = await Company.findOne({ administrator: req.user._id })
        .select("_id legalName tradeName rfc")
        .lean();

      // Si no se encuentra, buscar en Branch.administrator
      if (!company) {
        const branch = await Branch.findOne({ administrator: req.user._id })
          .select("companyId")
          .lean();

        if (branch) {
          company = await Company.findById(branch.companyId)
            .select("_id legalName tradeName rfc")
            .lean();
        }
      }

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una empresa asignada a tu usuario",
        });
      }
    }
    // Si es Gerente, buscar en cv_branches por el campo manager
    else if (userRole === "Gerente") {
      // Buscar la sucursal donde el usuario es manager
      const branch = await Branch.findOne({ manager: req.user._id })
        .select("companyId")
        .lean();

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una sucursal asignada a tu usuario",
        });
      }

      // Buscar la empresa por el companyId de la sucursal
      company = await Company.findById(branch.companyId)
        .select("_id legalName tradeName rfc")
        .lean();

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la empresa asociada a tu sucursal",
        });
      }
    }
    // Si es Super Admin o Distribuidor, no tienen una empresa específica
    else {
      return res.status(403).json({
        success: false,
        message: "Tu rol no tiene una empresa asignada automáticamente",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error al obtener empresa del usuario:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener la empresa del usuario",
    });
  }
};

// Obtener estadísticas del dashboard para Distribuidor
export const getDistributorDashboardStats = async (req, res) => {
  try {
    const distributorId = req.user._id;

    // Obtener filtros de query params
    const { startDate, endDate, companyId } = req.query;

    // Importar modelos necesarios
    const Order = (await import("../models/Order.js")).default;
    const { Client } = await import("../models/Client.js");
    const mongoose = await import("mongoose");

    // Construir filtro base de empresas
    let companyFilter = {
      distributor: distributorId,
      isActive: true
    };

    // Si se especifica un companyId, filtrar solo por esa empresa
    if (companyId) {
      companyFilter._id = new mongoose.Types.ObjectId(companyId);
    }

    // 1. Contar empresas del distribuidor (con filtro aplicado)
    const companiesCount = await Company.countDocuments(companyFilter);

    // Obtener IDs de todas las empresas del distribuidor (con filtro aplicado)
    const companies = await Company.find(companyFilter).select("_id").lean();

    const companyIds = companies.map(c => c._id);

    // Si no hay empresas que coincidan con el filtro, retornar datos vacíos
    if (companyIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          companies: 0,
          branches: 0,
          clients: 0,
          orders: 0,
          totalSales: 0,
          dailyRevenue: [],
          monthlyRevenue: [],
          weeklySales: [],
          ordersByStatus: [],
          salesPerformance: {
            pending: { count: 0, percentage: "0" },
            inProcess: { count: 0, percentage: "0" },
            completed: { count: 0, percentage: "0" }
          },
          recentOrders: [],
          topClients: [],
          topBranches: []
        }
      });
    }

    // 2. Contar sucursales de todas las empresas
    const branchesCount = await Branch.countDocuments({
      companyId: { $in: companyIds },
      isActive: true
    });

    // Obtener IDs de todas las sucursales
    const branches = await Branch.find({
      companyId: { $in: companyIds },
      isActive: true
    }).select("_id").lean();

    const branchIds = branches.map(b => b._id);

    // Construir filtro de fechas para órdenes
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        orderDate: {
          $gte: start,
          $lte: end
        }
      };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter = { orderDate: { $gte: start } };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { orderDate: { $lte: end } };
    }

    // Filtro base de órdenes (incluyendo branchIds y fechas si aplican)
    const orderBaseFilter = {
      branchId: { $in: branchIds },
      ...dateFilter
    };

    // 3. Contar clientes de todas las sucursales
    const clientsCount = await Client.countDocuments({
      branch: { $in: branchIds },
      status: true
    });

    // 4. Contar órdenes de todas las sucursales (con filtro de fechas)
    const ordersCount = await Order.countDocuments(orderBaseFilter);

    // 5. Calcular total vendido (suma de total de todas las órdenes con filtro de fechas)
    const totalSalesResult = await Order.aggregate([
      {
        $match: orderBaseFilter
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" }
        }
      }
    ]);

    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

    // 6. Obtener estadísticas adicionales para los gráficos
    // Revenue por día - usar el rango de fechas del filtro o últimos 30 días por defecto
    let dailyRevenueStartDate;
    if (startDate) {
      dailyRevenueStartDate = new Date(startDate);
      dailyRevenueStartDate.setHours(0, 0, 0, 0);
    } else {
      dailyRevenueStartDate = new Date();
      dailyRevenueStartDate.setDate(dailyRevenueStartDate.getDate() - 30);
    }

    let dailyRevenueEndDate;
    if (endDate) {
      dailyRevenueEndDate = new Date(endDate);
      dailyRevenueEndDate.setHours(23, 59, 59, 999);
    } else {
      dailyRevenueEndDate = new Date();
      dailyRevenueEndDate.setHours(23, 59, 59, 999);
    }

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          branchId: { $in: branchIds },
          orderDate: {
            $gte: dailyRevenueStartDate,
            $lte: dailyRevenueEndDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" }
          },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    // Revenue por mes - usar el rango de fechas del filtro o últimos 6 meses por defecto
    let monthlyRevenueStartDate;
    if (startDate) {
      monthlyRevenueStartDate = new Date(startDate);
      monthlyRevenueStartDate.setHours(0, 0, 0, 0);
    } else {
      monthlyRevenueStartDate = new Date();
      monthlyRevenueStartDate.setMonth(monthlyRevenueStartDate.getMonth() - 6);
    }

    let monthlyRevenueEndDate;
    if (endDate) {
      monthlyRevenueEndDate = new Date(endDate);
      monthlyRevenueEndDate.setHours(23, 59, 59, 999);
    } else {
      monthlyRevenueEndDate = new Date();
      monthlyRevenueEndDate.setHours(23, 59, 59, 999);
    }

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          branchId: { $in: branchIds },
          orderDate: {
            $gte: monthlyRevenueStartDate,
            $lte: monthlyRevenueEndDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
          },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Ventas por semana - usar el rango de fechas del filtro o mes actual por defecto
    let weeklyStartDate;
    if (startDate) {
      weeklyStartDate = new Date(startDate);
      weeklyStartDate.setHours(0, 0, 0, 0);
    } else {
      weeklyStartDate = new Date();
      weeklyStartDate.setDate(1);
      weeklyStartDate.setHours(0, 0, 0, 0);
    }

    let weeklyEndDate;
    if (endDate) {
      weeklyEndDate = new Date(endDate);
      weeklyEndDate.setHours(23, 59, 59, 999);
    } else {
      weeklyEndDate = new Date();
      weeklyEndDate.setHours(23, 59, 59, 999);
    }

    const weeklySales = await Order.aggregate([
      {
        $match: {
          branchId: { $in: branchIds },
          orderDate: {
            $gte: weeklyStartDate,
            $lte: weeklyEndDate
          }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: "$orderDate" }
          },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.week": 1 }
      }
    ]);

    // Órdenes por estado (con filtro de fechas)
    const ordersByStatus = await Order.aggregate([
      {
        $match: orderBaseFilter
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Calcular rendimiento de ventas (con filtro de fechas)
    const allOrders = await Order.find(orderBaseFilter).select('status advance sendToProduction').lean();

    // Debug: Mostrar todas las órdenes con sus estados
    console.log('All Orders Status:', allOrders.map(order => ({
      status: order.status,
      advance: order.advance,
      sendToProduction: order.sendToProduction
    })));

    // Ventas pendientes: status = 'sinAnticipo' y sendToProduction = false
    const pendingOrders = allOrders.filter(order =>
      order.status === 'sinAnticipo' &&
      (order.sendToProduction === false || !order.sendToProduction)
    );

    // Ventas en proceso: con anticipo (advance > 0) o sendToProduction = true
    const inProcessOrders = allOrders.filter(order =>
      (order.advance > 0 || order.sendToProduction === true) &&
      order.status !== 'completado' &&
      order.status !== 'cancelado'
    );

    // Ventas completadas: status = 'completado'
    const completedOrders = allOrders.filter(order =>
      order.status === 'completado'
    );

    const totalOrdersForPercentage = allOrders.filter(order =>
      order.status !== 'cancelado'
    ).length;

    const salesPerformance = {
      pending: {
        count: pendingOrders.length,
        percentage: totalOrdersForPercentage > 0
          ? ((pendingOrders.length / totalOrdersForPercentage) * 100).toFixed(2)
          : "0"
      },
      inProcess: {
        count: inProcessOrders.length,
        percentage: totalOrdersForPercentage > 0
          ? ((inProcessOrders.length / totalOrdersForPercentage) * 100).toFixed(2)
          : "0"
      },
      completed: {
        count: completedOrders.length,
        percentage: totalOrdersForPercentage > 0
          ? ((completedOrders.length / totalOrdersForPercentage) * 100).toFixed(2)
          : "0"
      }
    };

    // Debug: Log para verificar el cálculo de rendimiento de ventas
    console.log('Sales Performance Calculation:', {
      totalOrders: allOrders.length,
      totalForPercentage: totalOrdersForPercentage,
      pending: { count: pendingOrders.length, percentage: salesPerformance.pending.percentage },
      inProcess: { count: inProcessOrders.length, percentage: salesPerformance.inProcess.percentage },
      completed: { count: completedOrders.length, percentage: salesPerformance.completed.percentage }
    });

    // 7. Obtener las 5 órdenes más recientes (con filtro de fechas)
    const recentOrders = await Order.find(orderBaseFilter)
      .populate('branchId', 'branchName')
      .populate('cashier', 'username profile.name profile.lastName profile.fullName')
      .populate('clientInfo.clientId', 'name lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 8. Obtener top 10 clientes que más han gastado (con filtro de fechas)
    const topClients = await Order.aggregate([
      {
        $match: {
          ...orderBaseFilter,
          status: { $ne: 'cancelado' } // Excluir órdenes canceladas
        }
      },
      {
        $group: {
          _id: {
            clientId: '$clientInfo.clientId',
            clientName: '$clientInfo.name',
            clientLastName: '$clientInfo.lastName'
          },
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          clientId: '$_id.clientId',
          clientName: '$_id.clientName',
          clientLastName: '$_id.clientLastName',
          totalSpent: 1,
          orderCount: 1,
          lastOrderDate: 1
        }
      }
    ]);

    // Popular información adicional del cliente si existe clientId
    for (let client of topClients) {
      if (client.clientId) {
        const clientDetails = await Client.findById(client.clientId)
          .select('name lastName phoneNumber email')
          .lean();

        if (clientDetails) {
          client.clientInfo = clientDetails;
        }
      }
    }

    // 9. Obtener top 5 sucursales que más han vendido (con filtro de fechas)
    const topBranches = await Order.aggregate([
      {
        $match: {
          ...orderBaseFilter,
          status: { $ne: 'cancelado' } // Excluir órdenes canceladas
        }
      },
      {
        $group: {
          _id: '$branchId',
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Popular información de las sucursales
    for (let branch of topBranches) {
      const branchDetails = await Branch.findById(branch._id)
        .select('branchName branchCode companyId')
        .populate('companyId', 'tradeName legalName')
        .lean();

      if (branchDetails) {
        branch.branchInfo = branchDetails;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        companies: companiesCount,
        branches: branchesCount,
        clients: clientsCount,
        orders: ordersCount,
        totalSales: totalSales,
        dailyRevenue: dailyRevenue,
        monthlyRevenue: monthlyRevenue,
        weeklySales: weeklySales,
        ordersByStatus: ordersByStatus,
        salesPerformance: salesPerformance,
        recentOrders: recentOrders,
        topClients: topClients,
        topBranches: topBranches
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener estadísticas del dashboard",
    });
  }
};
