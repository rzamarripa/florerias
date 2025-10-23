import { Storage } from "../models/Storage.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";
import { Role } from "../models/Roles.js";
import Product from "../models/Product.js";

// Crear nuevo almacén
export const createStorage = async (req, res) => {
  try {
    const { branch, warehouseManagerData, products, address } = req.body;

    // Validar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Verificar que la sucursal existe
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }

    // Verificar que no exista ya un almacén para esta sucursal
    const existingStorage = await Storage.findOne({ branch });
    if (existingStorage) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un almacén para esta sucursal",
      });
    }

    // Verificar que se proporcionaron datos del gerente de almacén
    if (!warehouseManagerData) {
      return res.status(400).json({
        success: false,
        message: "Los datos del gerente de almacén son requeridos",
      });
    }

    // Buscar el rol de Gerente de Almacén (o Gerente)
    const warehouseManagerRole = await Role.findOne({ name: /^Gerente$/i });
    if (!warehouseManagerRole) {
      return res.status(400).json({
        success: false,
        message: "No se encontró el rol de Gerente en el sistema",
      });
    }

    // Verificar que no exista un usuario con el mismo username o email
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${warehouseManagerData.username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${warehouseManagerData.email}$`, 'i') } },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.username.toLowerCase() === warehouseManagerData.username.toLowerCase()
            ? "Ya existe un usuario con este nombre de usuario"
            : "Ya existe un usuario con este email",
      });
    }

    // Crear el nuevo usuario gerente de almacén
    const newWarehouseManager = await User.create({
      username: warehouseManagerData.username,
      email: warehouseManagerData.email,
      phone: warehouseManagerData.phone,
      password: warehouseManagerData.password,
      profile: {
        name: warehouseManagerData.profile.name,
        lastName: warehouseManagerData.profile.lastName,
        fullName: `${warehouseManagerData.profile.name} ${warehouseManagerData.profile.lastName}`,
        estatus: true,
      },
      role: warehouseManagerRole._id,
    });

    // Validar productos si se proporcionan
    if (products && products.length > 0) {
      const productIds = products.map((p) => p.productId);
      const productCount = await Product.countDocuments({
        _id: { $in: productIds },
      });
      if (productCount !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Uno o más productos no existen",
        });
      }
    }

    const storage = await Storage.create({
      branch,
      warehouseManager: newWarehouseManager._id,
      products: products || [],
      address,
      lastIncome: products && products.length > 0 ? Date.now() : null,
    });

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad");

    res.status(201).json({
      success: true,
      message: "Almacén creado exitosamente",
      data: storage,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un almacén para esta sucursal",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todos los almacenes
export const getAllStorages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    // Filtros opcionales
    if (req.query.branch) {
      filters.branch = req.query.branch;
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.search) {
      // Buscar por nombre de sucursal (requiere populate)
      const branches = await Branch.find({
        branchName: { $regex: req.query.search, $options: "i" },
      }).select("_id");

      filters.branch = { $in: branches.map((b) => b._id) };
    }

    const storages = await Storage.find(filters)
      .populate("branch", "branchName branchCode address isActive")
      .populate(
        "warehouseManager",
        "username email profile.name profile.lastName profile.fullName"
      )
      .populate("products.productId", "nombre unidad imagen")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Storage.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: storages.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: storages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener almacén por ID
export const getStorageById = async (req, res) => {
  try {
    const storage = await Storage.findById(req.params.id)
      .populate("branch", "branchName branchCode address contactPhone contactEmail")
      .populate(
        "warehouseManager",
        "username email phone profile.name profile.lastName profile.fullName"
      )
      .populate("products.productId", "nombre unidad descripcion imagen totalCosto totalVenta");

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener almacén por sucursal
export const getStorageByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const storage = await Storage.findOne({ branch: branchId })
      .populate("branch", "branchName branchCode address contactPhone contactEmail")
      .populate(
        "warehouseManager",
        "username email phone profile.name profile.lastName profile.fullName"
      )
      .populate("products.productId", "nombre unidad descripcion imagen totalCosto totalVenta");

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "No se encontró almacén para esta sucursal",
      });
    }

    res.status(200).json({
      success: true,
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar almacén
export const updateStorage = async (req, res) => {
  try {
    const { warehouseManager, address } = req.body;

    const updateData = {};

    if (warehouseManager) {
      // Verificar que el gerente existe
      const manager = await User.findById(warehouseManager);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Gerente de almacén no encontrado",
        });
      }
      updateData.warehouseManager = warehouseManager;
    }

    if (address) {
      updateData.address = address;
    }

    const storage = await Storage.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("branch", "branchName branchCode")
      .populate("warehouseManager", "username email profile")
      .populate("products.productId", "nombre unidad");

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Almacén actualizado exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Agregar productos al almacén (ingreso)
export const addProductsToStorage = async (req, res) => {
  try {
    const { products } = req.body; // Array de { productId, quantity }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de productos",
      });
    }

    const storage = await Storage.findById(req.params.id);

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    // Validar que todos los productos existen
    const productIds = products.map((p) => p.productId);
    const productCount = await Product.countDocuments({
      _id: { $in: productIds },
    });

    if (productCount !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Uno o más productos no existen",
      });
    }

    // Agregar o actualizar productos
    for (const item of products) {
      const existingProductIndex = storage.products.findIndex(
        (p) => p.productId.toString() === item.productId
      );

      if (existingProductIndex !== -1) {
        // Producto existe, incrementar cantidad
        storage.products[existingProductIndex].quantity += item.quantity;
      } else {
        // Producto nuevo, agregarlo
        storage.products.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    // Actualizar fecha de último ingreso
    storage.lastIncome = Date.now();

    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen");

    res.status(200).json({
      success: true,
      message: "Productos agregados exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remover productos del almacén (egreso)
export const removeProductsFromStorage = async (req, res) => {
  try {
    const { products } = req.body; // Array de { productId, quantity }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de productos",
      });
    }

    const storage = await Storage.findById(req.params.id);

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    // Remover o actualizar productos
    for (const item of products) {
      const existingProductIndex = storage.products.findIndex(
        (p) => p.productId.toString() === item.productId
      );

      if (existingProductIndex === -1) {
        return res.status(400).json({
          success: false,
          message: `Producto ${item.productId} no existe en el almacén`,
        });
      }

      const currentQuantity = storage.products[existingProductIndex].quantity;

      if (currentQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cantidad insuficiente del producto ${item.productId}. Disponible: ${currentQuantity}, Solicitado: ${item.quantity}`,
        });
      }

      // Reducir cantidad
      storage.products[existingProductIndex].quantity -= item.quantity;

      // Si la cantidad llega a 0, remover el producto del array
      if (storage.products[existingProductIndex].quantity === 0) {
        storage.products.splice(existingProductIndex, 1);
      }
    }

    // Actualizar fecha de último egreso
    storage.lastOutcome = Date.now();

    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen");

    res.status(200).json({
      success: true,
      message: "Productos removidos exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar cantidad de un producto específico
export const updateProductQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Se requiere productId y quantity",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "La cantidad no puede ser negativa",
      });
    }

    const storage = await Storage.findById(req.params.id);

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    const existingProductIndex = storage.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (existingProductIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el almacén",
      });
    }

    const oldQuantity = storage.products[existingProductIndex].quantity;
    storage.products[existingProductIndex].quantity = quantity;

    // Actualizar fecha según si fue ingreso o egreso
    if (quantity > oldQuantity) {
      storage.lastIncome = Date.now();
    } else if (quantity < oldQuantity) {
      storage.lastOutcome = Date.now();
    }

    // Si la cantidad es 0, remover el producto
    if (quantity === 0) {
      storage.products.splice(existingProductIndex, 1);
    }

    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen");

    res.status(200).json({
      success: true,
      message: "Cantidad actualizada exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar almacén
export const deactivateStorage = async (req, res) => {
  try {
    const storage = await Storage.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate("branch", "branchName branchCode")
      .populate("warehouseManager", "username email");

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Almacén desactivado exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar almacén
export const activateStorage = async (req, res) => {
  try {
    const storage = await Storage.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )
      .populate("branch", "branchName branchCode")
      .populate("warehouseManager", "username email");

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Almacén activado exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar almacén
export const deleteStorage = async (req, res) => {
  try {
    const storage = await Storage.findByIdAndDelete(req.params.id);

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Almacén eliminado exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
