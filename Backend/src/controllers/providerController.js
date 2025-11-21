import { Provider } from "../models/Provider.js";
import { Company } from "../models/Company.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";

// Crear nuevo proveedor
export const createProvider = async (req, res) => {
  try {
    const {
      contactName,
      tradeName,
      legalName,
      rfc,
      phone,
      address,
      email,
      company,
    } = req.body;

    // Verificar si ya existe un proveedor con el mismo RFC
    const existingProvider = await Provider.findOne({ rfc });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un proveedor con este RFC",
      });
    }

    // Verificar que la empresa exista
    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

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

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      let hasPermission = false;

      // Si es Administrador, verificar que la empresa le pertenece
      if (userRole === "Administrador") {
        // Verificar si es administrador directo de la empresa
        const companyAsAdmin = await Company.findOne({
          _id: company,
          administrator: req.user._id,
        });

        if (companyAsAdmin) {
          hasPermission = true;
        } else {
          // Verificar si es administrador de una sucursal de esta empresa
          const branchAsAdmin = await Branch.findOne({
            administrator: req.user._id,
          });

          if (branchAsAdmin && branchAsAdmin.companyId.toString() === company) {
            hasPermission = true;
          }
        }
      }
      // Si es Gerente, verificar que la empresa es la de su sucursal
      else if (userRole === "Gerente") {
        const branch = await Branch.findOne({
          manager: req.user._id,
        });

        if (branch && branch.companyId.toString() === company) {
          hasPermission = true;
        }
      }
      // Distribuidor u otros roles
      else {
        const userCompany = await Company.findOne({
          _id: company,
          distributor: req.user._id,
        });

        if (userCompany) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear proveedores en esta empresa",
        });
      }
    }

    const provider = await Provider.create({
      contactName,
      tradeName,
      legalName,
      rfc,
      phone,
      address,
      email,
      company,
    });

    // Popular la empresa para la respuesta
    await provider.populate("company", "legalName tradeName rfc");

    res.status(201).json({
      success: true,
      message: "Proveedor creado exitosamente",
      data: provider,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un proveedor con este RFC",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todos los proveedores
export const getAllProviders = async (req, res) => {
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
      // Super Admin puede ver todos los proveedores (no se agrega filtro)
    } else if (userRole === "Administrador") {
      // Administrador ve proveedores de empresas donde es administrator (Company o Branch)
      const companyIds = [];

      // Buscar en Company.administrator
      const companiesAsAdmin = await Company.find({
        administrator: req.user._id,
      }).select("_id");
      companyIds.push(...companiesAsAdmin.map((c) => c._id));

      // Buscar en Branch.administrator
      const branchesAsAdmin = await Branch.find({
        administrator: req.user._id,
      }).select("companyId");
      companyIds.push(...branchesAsAdmin.map((b) => b.companyId));

      // Eliminar duplicados
      const uniqueCompanyIds = [...new Set(companyIds.map((id) => id.toString()))];

      if (uniqueCompanyIds.length > 0) {
        filters.company = { $in: uniqueCompanyIds };
      } else {
        // Si no tiene empresas asignadas, no mostrar ningún proveedor
        filters.company = { $in: [] };
      }
    } else if (userRole === "Gerente") {
      // Gerente solo ve proveedores de la empresa de su sucursal
      const branch = await Branch.findOne({
        manager: req.user._id,
      }).select("companyId");

      if (branch) {
        filters.company = branch.companyId;
      } else {
        // Si no tiene sucursal asignada, no mostrar ningún proveedor
        filters.company = { $in: [] };
      }
    } else {
      // Distribuidor u otros roles solo ven proveedores de empresas donde son distributor
      const userCompanies = await Company.find({
        distributor: req.user._id,
      }).select("_id");

      const companyIds = userCompanies.map((company) => company._id);

      if (companyIds.length > 0) {
        filters.company = { $in: companyIds };
      } else {
        // Si no tiene empresas asignadas, no mostrar ningún proveedor
        filters.company = { $in: [] };
      }
    }

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.company) {
      filters.company = req.query.company;
    }

    if (req.query.search) {
      filters.$or = [
        { contactName: { $regex: req.query.search, $options: "i" } },
        { tradeName: { $regex: req.query.search, $options: "i" } },
        { legalName: { $regex: req.query.search, $options: "i" } },
        { rfc: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const providers = await Provider.find(filters)
      .populate("company", "legalName tradeName rfc")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Provider.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: providers.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: providers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener proveedor por ID
export const getProviderById = async (req, res) => {
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

    const provider = await Provider.findById(req.params.id).populate(
      "company",
      "legalName tradeName rfc"
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      // Verificar que la empresa del proveedor pertenezca al usuario
      const userCompany = await Company.findById(provider.company._id);

      if (userRole === "Administrador") {
        if (userCompany.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver este proveedor",
          });
        }
      } else {
        // Distribuidor u otros roles
        if (userCompany.distributor.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver este proveedor",
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar proveedor
export const updateProvider = async (req, res) => {
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

    // Verificar que el proveedor existe
    const existingProvider = await Provider.findById(req.params.id).populate(
      "company"
    );

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    // Verificar permisos según el rol (excepto Super Admin)
    if (userRole !== "Super Admin") {
      const userCompany = await Company.findById(existingProvider.company._id);

      if (userRole === "Administrador") {
        if (userCompany.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para actualizar este proveedor",
          });
        }
      } else {
        // Distribuidor u otros roles
        if (userCompany.distributor.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para actualizar este proveedor",
          });
        }
      }
    }

    const {
      contactName,
      tradeName,
      legalName,
      rfc,
      phone,
      address,
      email,
      company,
    } = req.body;

    // Si se está actualizando el RFC, verificar que no exista en otro proveedor
    if (rfc && rfc !== existingProvider.rfc) {
      const providerWithRfc = await Provider.findOne({
        rfc,
        _id: { $ne: req.params.id },
      });

      if (providerWithRfc) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro proveedor con este RFC",
        });
      }
    }

    // Si se está actualizando la empresa, verificar que exista
    if (company && company !== existingProvider.company._id.toString()) {
      const companyExists = await Company.findById(company);
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
      }
    }

    const updateData = {};
    if (contactName) updateData.contactName = contactName;
    if (tradeName) updateData.tradeName = tradeName;
    if (legalName) updateData.legalName = legalName;
    if (rfc) updateData.rfc = rfc;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (email) updateData.email = email;
    if (company) updateData.company = company;

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("company", "legalName tradeName rfc");

    res.status(200).json({
      success: true,
      message: "Proveedor actualizado exitosamente",
      data: provider,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un proveedor con este RFC",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar proveedor
export const deactivateProvider = async (req, res) => {
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

    // Verificar que el proveedor existe
    const existingProvider = await Provider.findById(req.params.id).populate(
      "company"
    );

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    // Verificar permisos según el rol (excepto Super Admin)
    if (userRole !== "Super Admin") {
      const userCompany = await Company.findById(existingProvider.company._id);

      if (userRole === "Administrador") {
        if (userCompany.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para desactivar este proveedor",
          });
        }
      } else {
        // Distribuidor u otros roles
        if (userCompany.distributor.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para desactivar este proveedor",
          });
        }
      }
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate("company", "legalName tradeName rfc");

    res.status(200).json({
      success: true,
      message: "Proveedor desactivado exitosamente",
      data: provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar proveedor
export const activateProvider = async (req, res) => {
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

    // Verificar que el proveedor existe
    const existingProvider = await Provider.findById(req.params.id).populate(
      "company"
    );

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    // Verificar permisos según el rol (excepto Super Admin)
    if (userRole !== "Super Admin") {
      const userCompany = await Company.findById(existingProvider.company._id);

      if (userRole === "Administrador") {
        if (userCompany.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para activar este proveedor",
          });
        }
      } else {
        // Distribuidor u otros roles
        if (userCompany.distributor.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para activar este proveedor",
          });
        }
      }
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).populate("company", "legalName tradeName rfc");

    res.status(200).json({
      success: true,
      message: "Proveedor activado exitosamente",
      data: provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar proveedor (físicamente)
export const deleteProvider = async (req, res) => {
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

    // Verificar que el proveedor existe
    const existingProvider = await Provider.findById(req.params.id).populate(
      "company"
    );

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    // Verificar permisos según el rol (excepto Super Admin)
    if (userRole !== "Super Admin") {
      const userCompany = await Company.findById(existingProvider.company._id);

      if (userRole === "Administrador") {
        if (userCompany.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar este proveedor",
          });
        }
      } else {
        // Distribuidor u otros roles
        if (userCompany.distributor.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar este proveedor",
          });
        }
      }
    }

    const provider = await Provider.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Proveedor eliminado exitosamente",
      data: provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
