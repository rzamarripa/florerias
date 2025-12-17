import { Storage } from "../models/Storage.js";
import { Branch } from "../models/Branch.js";
import { User } from "../models/User.js";
import { Role } from "../models/Roles.js";
import Product from "../models/Product.js";
import Material from "../models/Material.js";

// Crear nuevo almacén
export const createStorage = async (req, res) => {
  try {
    const { branch, name, warehouseManagerData, products, address } = req.body;

    // Validar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Validar que se proporcione el nombre del almacén
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre del almacén es requerido",
      });
    }

    // Obtener el usuario autenticado con su rol
    const currentUser = await User.findById(req.user._id).populate("role");
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    console.log("Usuario actual:", {
      id: currentUser._id,
      username: currentUser.username,
      roleName: currentUser.role?.name
    });

    let branchId = branch;

    // Si el usuario es Gerente, buscar su sucursal por campo manager
    if (currentUser.role && currentUser.role.name === "Gerente") {
      console.log("Buscando sucursal para gerente:", currentUser._id);
      const managerBranch = await Branch.findOne({ manager: currentUser._id });
      console.log("Sucursal encontrada:", managerBranch);

      if (!managerBranch) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una sucursal asignada a este gerente",
        });
      }
      branchId = managerBranch._id;
      console.log("BranchId asignado:", branchId);
    }
    // Si el usuario es Cajero, buscar su sucursal por campo employees
    else if (currentUser.role && currentUser.role.name === "Cajero") {
      console.log("Buscando sucursal para cajero:", currentUser._id);
      const cashierBranch = await Branch.findOne({ employees: currentUser._id });
      console.log("Sucursal encontrada:", cashierBranch);

      if (!cashierBranch) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una sucursal asignada a este cajero",
        });
      }
      branchId = cashierBranch._id;
      console.log("BranchId asignado:", branchId);
    }
    else if (!branchId) {
      // Si es administrador y no se proporciona branch, error
      return res.status(400).json({
        success: false,
        message: "La sucursal es requerida",
      });
    }

    // Verificar que la sucursal existe
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      console.log("Sucursal no encontrada con ID:", branchId);
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada",
      });
    }
    console.log("Sucursal existe:", branchExists.branchName);

    // Verificar que no exista ya un almacén para esta sucursal
    const existingStorage = await Storage.findOne({ branch: branchId });
    console.log("Almacén existente:", existingStorage);
    if (existingStorage) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un almacén para esta sucursal",
      });
    }

    // Crear el almacén con datos básicos
    const storageData = {
      branch: branchId,
      name: name.trim(),
      products: products || [],
      lastIncome: products && products.length > 0 ? Date.now() : null,
    };
    console.log("Datos del almacén a crear:", storageData);

    // Si se proporcionan datos del gerente de almacén (flujo antiguo para compatibilidad)
    if (warehouseManagerData) {
      const warehouseManagerRole = await Role.findOne({ name: /^Gerente$/i });
      if (!warehouseManagerRole) {
        return res.status(400).json({
          success: false,
          message: "No se encontró el rol de Gerente en el sistema",
        });
      }

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

      storageData.warehouseManager = newWarehouseManager._id;
    }

    // Si se proporciona dirección
    if (address) {
      storageData.address = address;
    }

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

    console.log("Intentando crear almacén...");
    const storage = await Storage.create(storageData);
    console.log("Almacén creado exitosamente:", storage._id);

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    if (storage.warehouseManager) {
      await storage.populate("warehouseManager", "username email profile");
    }
    await storage.populate("products.productId", "nombre unidad");

    res.status(201).json({
      success: true,
      message: "Almacén creado exitosamente",
      data: storage,
    });
  } catch (error) {
    console.error("Error al crear almacén:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);

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
      .populate("materials.materialId", "name unit price cost piecesPerPackage")
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
      .populate("products.productId", "nombre unidad descripcion imagen totalCosto totalVenta")
      .populate({
        path: "materials.materialId",
        select: "name unit price cost piecesPerPackage description status",
        populate: {
          path: "unit",
          select: "name abbreviation"
        }
      });

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
      .populate("products.productId", "nombre unidad descripcion imagen totalCosto totalVenta")
      .populate("materials.materialId", "name unit price cost piecesPerPackage description status");

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
    const { name, warehouseManager, address } = req.body;

    const updateData = {};

    if (name && name.trim() !== "") {
      updateData.name = name.trim();
    }

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
      .populate("products.productId", "nombre unidad")
      .populate("materials.materialId", "name unit price cost piecesPerPackage");

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
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage");

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
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage");

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
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage description status");

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
      .populate("warehouseManager", "username email")
      .populate("products.productId", "nombre unidad imagen")
      .populate("materials.materialId", "name unit price cost piecesPerPackage description status");

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
      .populate("warehouseManager", "username email")
      .populate("products.productId", "nombre unidad imagen")
      .populate("materials.materialId", "name unit price cost piecesPerPackage description status");

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

// Reservar stock temporalmente (para cuando se agrega a la orden)
export const reserveStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere productId y quantity válida",
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

    const currentQuantity = storage.products[existingProductIndex].quantity;

    if (currentQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${currentQuantity}, Solicitado: ${quantity}`,
      });
    }

    // Reducir el stock temporalmente
    storage.products[existingProductIndex].quantity -= quantity;

    // Si la cantidad llega a 0, no remover el producto, dejarlo en 0
    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen totalCosto totalVenta");
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage description status");

    res.status(200).json({
      success: true,
      message: "Stock reservado temporalmente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Liberar stock (para cuando se elimina de la orden)
export const releaseStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere productId y quantity válida",
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

    // Incrementar el stock nuevamente
    storage.products[existingProductIndex].quantity += quantity;

    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen totalCosto totalVenta");
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage description status");

    res.status(200).json({
      success: true,
      message: "Stock liberado exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verificar si existe almacén para una sucursal
export const checkStorageExists = async (req, res) => {
  try {
    const { branchId } = req.params;

    const storage = await Storage.findOne({ branch: branchId }).select('_id branch');

    res.status(200).json({
      success: true,
      exists: !!storage,
      storageId: storage?._id || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================== FUNCIONES PARA MATERIALES =====================

// Agregar materiales al almacén (ingreso)
export const addMaterialsToStorage = async (req, res) => {
  try {
    const { materials } = req.body; // Array de { materialId, quantity }

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de materiales",
      });
    }

    const storage = await Storage.findById(req.params.id);

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    // Validar que todos los materiales existen
    const materialIds = materials.map((m) => m.materialId);
    const materialCount = await Material.countDocuments({
      _id: { $in: materialIds },
    });

    if (materialCount !== materialIds.length) {
      return res.status(400).json({
        success: false,
        message: "Uno o más materiales no existen",
      });
    }

    // Agregar o actualizar materiales
    for (const item of materials) {
      const existingMaterialIndex = storage.materials.findIndex(
        (m) => m.materialId.toString() === item.materialId
      );

      if (existingMaterialIndex !== -1) {
        // Material existe, incrementar cantidad
        storage.materials[existingMaterialIndex].quantity += item.quantity;
      } else {
        // Material nuevo, agregarlo
        storage.materials.push({
          materialId: item.materialId,
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
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage description status");

    res.status(200).json({
      success: true,
      message: "Materiales agregados exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remover materiales del almacén (egreso)
export const removeMaterialsFromStorage = async (req, res) => {
  try {
    const { materials } = req.body; // Array de { materialId, quantity }

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de materiales",
      });
    }

    const storage = await Storage.findById(req.params.id);

    if (!storage) {
      return res.status(404).json({
        success: false,
        message: "Almacén no encontrado",
      });
    }

    // Remover o actualizar materiales
    for (const item of materials) {
      const existingMaterialIndex = storage.materials.findIndex(
        (m) => m.materialId.toString() === item.materialId
      );

      if (existingMaterialIndex === -1) {
        return res.status(400).json({
          success: false,
          message: `Material ${item.materialId} no existe en el almacén`,
        });
      }

      const currentQuantity = storage.materials[existingMaterialIndex].quantity;

      if (currentQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cantidad insuficiente del material ${item.materialId}. Disponible: ${currentQuantity}, Solicitado: ${item.quantity}`,
        });
      }

      // Reducir cantidad
      storage.materials[existingMaterialIndex].quantity -= item.quantity;

      // Si la cantidad llega a 0, remover el material del array
      if (storage.materials[existingMaterialIndex].quantity === 0) {
        storage.materials.splice(existingMaterialIndex, 1);
      }
    }

    // Actualizar fecha de último egreso
    storage.lastOutcome = Date.now();

    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen");
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage description status");

    res.status(200).json({
      success: true,
      message: "Materiales removidos exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar cantidad de un material específico
export const updateMaterialQuantity = async (req, res) => {
  try {
    const { materialId, quantity } = req.body;

    if (!materialId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Se requiere materialId y quantity",
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

    const existingMaterialIndex = storage.materials.findIndex(
      (m) => m.materialId.toString() === materialId
    );

    if (existingMaterialIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Material no encontrado en el almacén",
      });
    }

    const oldQuantity = storage.materials[existingMaterialIndex].quantity;
    storage.materials[existingMaterialIndex].quantity = quantity;

    // Actualizar fecha según si fue ingreso o egreso
    if (quantity > oldQuantity) {
      storage.lastIncome = Date.now();
    } else if (quantity < oldQuantity) {
      storage.lastOutcome = Date.now();
    }

    // Si la cantidad es 0, remover el material
    if (quantity === 0) {
      storage.materials.splice(existingMaterialIndex, 1);
    }

    await storage.save();

    // Popular los datos para la respuesta
    await storage.populate("branch", "branchName branchCode");
    await storage.populate("warehouseManager", "username email profile");
    await storage.populate("products.productId", "nombre unidad imagen");
    await storage.populate("materials.materialId", "name unit price cost piecesPerPackage description status");

    res.status(200).json({
      success: true,
      message: "Cantidad de material actualizada exitosamente",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
