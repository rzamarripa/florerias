import { ProductCategory } from "../models/ProductCategory.js";
import { User } from "../models/User.js";
import { Branch } from "../models/Branch.js";
import { Company } from "../models/Company.js";

// Crear nueva categoría de producto
export const createProductCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const userId = req.user._id;

    // Obtener el rol del usuario
    const currentUser = await User.findById(userId).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar permisos: solo Super Admin y Administrador pueden crear categorías
    if (userRole !== "Super Admin" && userRole !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear categorías de productos",
      });
    }

    // Obtener el company ID según el rol del usuario
    let companyId = null;

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

    const productCategory = await ProductCategory.create({
      name,
      description,
      company: companyId,
    });

    // Popular la empresa para la respuesta
    await productCategory.populate('company', 'legalName tradeName');

    res.status(201).json({
      success: true,
      message: "Categoría de producto creada exitosamente",
      data: productCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todas las categorías de productos
export const getAllProductCategories = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const userId = req.user._id;

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    console.log('[ProductCategories] Usuario:', userId, 'Rol:', userRole);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
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
        // Si no tiene empresa, no retornar ninguna categoría
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          },
          data: []
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
          // Si no tiene empresa, no retornar ninguna categoría
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0
            },
            data: []
          });
        }
      } else {
        // Si no tiene sucursal, no retornar ninguna categoría
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          },
          data: []
        });
      }
    } else if (userRole === 'Cajero') {
      // Para Cajero, buscar la sucursal donde está asignado
      const userBranch = await Branch.findOne({
        employees: userId
      });

      console.log('[ProductCategories] Cajero - Sucursal encontrada:', userBranch?._id);

      if (userBranch) {
        // Buscar la empresa que contiene esta sucursal
        const company = await Company.findOne({
          branches: userBranch._id
        });

        console.log('[ProductCategories] Cajero - Empresa encontrada:', company?._id);

        if (company) {
          filters.company = company._id;
        } else {
          // Si no tiene empresa, no retornar ninguna categoría
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0
            },
            data: []
          });
        }
      } else {
        // Si no tiene sucursal, no retornar ninguna categoría
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          },
          data: []
        });
      }
    } else if (userRole === 'Redes') {
      // Para Redes, buscar la empresa donde está en el array redes
      const company = await Company.findOne({
        redes: userId
      });

      console.log('[ProductCategories] Redes - Empresa encontrada:', company?._id);

      if (company) {
        filters.company = company._id;
      } else {
        // Si no está en ninguna empresa, no retornar ninguna categoría
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          },
          data: []
        });
      }
    }
    // Super Admin puede ver todas las categorías (no se agrega filtro de company)

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    console.log('[ProductCategories] Filtros aplicados:', filters);

    const productCategories = await ProductCategory.find(filters)
      .populate('company', 'legalName tradeName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ProductCategory.countDocuments(filters);

    console.log('[ProductCategories] Total encontrados:', total, 'Retornando:', productCategories.length);

    res.status(200).json({
      success: true,
      count: productCategories.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: productCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener categoría de producto por ID
export const getProductCategoryById = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const productCategory = await ProductCategory.findById(req.params.id)
      .populate('company', 'legalName tradeName');

    if (!productCategory) {
      return res.status(404).json({
        success: false,
        message: "Categoría de producto no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: productCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar categoría de producto
export const updateProductCategory = async (req, res) => {
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

    // Verificar permisos: solo Super Admin y Administrador pueden actualizar categorías
    if (userRole !== "Super Admin" && userRole !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar categorías de productos",
      });
    }

    // Verificar que la categoría existe
    const existingCategory = await ProductCategory.findById(req.params.id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Categoría de producto no encontrada",
      });
    }

    const { name, description } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const productCategory = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('company', 'legalName tradeName');

    res.status(200).json({
      success: true,
      message: "Categoría de producto actualizada exitosamente",
      data: productCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar categoría de producto
export const deactivateProductCategory = async (req, res) => {
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

    // Verificar permisos: solo Super Admin y Administrador pueden desactivar categorías
    if (userRole !== "Super Admin" && userRole !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para desactivar categorías de productos",
      });
    }

    // Verificar que la categoría existe
    const existingCategory = await ProductCategory.findById(req.params.id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Categoría de producto no encontrada",
      });
    }

    const productCategory = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate('company', 'legalName tradeName');

    res.status(200).json({
      success: true,
      message: "Categoría de producto desactivada exitosamente",
      data: productCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar categoría de producto
export const activateProductCategory = async (req, res) => {
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

    // Verificar permisos: solo Super Admin y Administrador pueden activar categorías
    if (userRole !== "Super Admin" && userRole !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para activar categorías de productos",
      });
    }

    // Verificar que la categoría existe
    const existingCategory = await ProductCategory.findById(req.params.id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Categoría de producto no encontrada",
      });
    }

    const productCategory = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).populate('company', 'legalName tradeName');

    res.status(200).json({
      success: true,
      message: "Categoría de producto activada exitosamente",
      data: productCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar categoría de producto (físicamente)
export const deleteProductCategory = async (req, res) => {
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

    // Verificar permisos: solo Super Admin puede eliminar categorías
    if (userRole !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar categorías de productos",
      });
    }

    // Verificar que la categoría existe
    const existingCategory = await ProductCategory.findById(req.params.id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Categoría de producto no encontrada",
      });
    }

    const productCategory = await ProductCategory.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Categoría de producto eliminada exitosamente",
      data: productCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
