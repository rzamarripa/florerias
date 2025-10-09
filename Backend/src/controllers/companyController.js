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
      distributorId,
      distributorData,
    } = req.body;

    // Verificar si ya existe una empresa con el mismo RFC
    const existingCompany = await Company.findOne({ rfc });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una empresa con este RFC",
      });
    }

    let finalDistributorId = distributorId;

    // Si no se proporciona distributorId, crear un nuevo usuario distribuidor
    if (!distributorId && distributorData) {
      // Buscar el rol de Distribuidor
      const distributorRole = await Role.findOne({ name: /^Distribuidor$/i });
      if (!distributorRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Distribuidor",
        });
      }

      // Verificar que no exista un usuario con el mismo username o email
      const existingUser = await User.findOne({
        $or: [
          { username: distributorData.username },
          { email: distributorData.email },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username === distributorData.username
              ? "Ya existe un usuario con este nombre de usuario"
              : "Ya existe un usuario con este email",
        });
      }

      // Crear el nuevo usuario distribuidor
      const newDistributor = await User.create({
        username: distributorData.username,
        email: distributorData.email,
        phone: distributorData.phone,
        password: distributorData.password,
        profile: {
          name: distributorData.profile.name,
          lastName: distributorData.profile.lastName,
          fullName: `${distributorData.profile.name} ${distributorData.profile.lastName}`,
          estatus: true,
        },
        role: distributorRole._id,
      });

      finalDistributorId = newDistributor._id;
    } else if (distributorId) {
      // Verificar que el usuario existe y tiene rol de distribuidor
      const distributorUser = await User.findById(distributorId).populate(
        "role"
      );
      if (!distributorUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario distribuidor no encontrado",
        });
      }

      if (
        !distributorUser.role ||
        distributorUser.role.name !== "Distribuidor"
      ) {
        return res.status(400).json({
          success: false,
          message: "El usuario seleccionado no tiene el rol de Distribuidor",
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
      distributor: finalDistributorId,
    });

    // Popular el distribuidor para la respuesta
    await company.populate("distributor", "username email phone profile");

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
      .populate("distributor", "username email profile.name profile.lastName profile.fullName")
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
      .populate("distributor", "username email phone profile");

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
      distributorId,
      distributorData,
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
    if (distributorId !== undefined) {
      if (distributorId === null || distributorId === "") {
        // Si se pasa null o string vacío, remover el distribuidor
        updateData.distributor = null;
      } else {
        // Verificar que el usuario existe y tiene rol de distribuidor
        const distributorUser = await User.findById(distributorId).populate(
          "role"
        );
        if (!distributorUser) {
          return res.status(404).json({
            success: false,
            message: "Usuario distribuidor no encontrado",
          });
        }

        if (
          !distributorUser.role ||
          distributorUser.role.name !== "Distribuidor"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "El usuario seleccionado no tiene el rol de Distribuidor",
          });
        }

        updateData.distributor = distributorId;
      }
    } else if (distributorData) {
      // Crear nuevo distribuidor si se proporcionan datos
      const distributorRole = await Role.findOne({ name: /^Distribuidor$/i });
      if (!distributorRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Distribuidor",
        });
      }

      const existingUser = await User.findOne({
        $or: [
          { username: distributorData.username },
          { email: distributorData.email },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.username === distributorData.username
              ? "Ya existe un usuario con este nombre de usuario"
              : "Ya existe un usuario con este email",
        });
      }

      const newDistributor = await User.create({
        username: distributorData.username,
        email: distributorData.email,
        phone: distributorData.phone,
        password: distributorData.password,
        profile: {
          name: distributorData.profile.name,
          lastName: distributorData.profile.lastName,
          fullName: `${distributorData.profile.name} ${distributorData.profile.lastName}`,
          estatus: true,
        },
        role: distributorRole._id,
      });

      updateData.distributor = newDistributor._id;
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
      .populate("distributor", "username email phone profile");

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
      .populate("distributor", "username email profile");

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
      .populate("distributor", "username email profile");

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

// Obtener usuarios con rol Distribuidor activos
export const getDistributors = async (req, res) => {
  try {
    const distributorRole = await Role.findOne({ name: /^Distribuidor$/i });

    if (!distributorRole) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el rol de Distribuidor",
      });
    }

    const distributors = await User.find({
      role: distributorRole._id,
      "profile.estatus": true,
    }).select("username email phone profile");

    res.status(200).json({
      success: true,
      count: distributors.length,
      data: distributors,
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
      .populate("distributor", "username email profile")
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
