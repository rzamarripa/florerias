import Product from '../models/Product.js';
import ProductList from '../models/ProductList.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Obtener todos los productos con filtros y paginación
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      nombre,
      unidad,
      estatus
    } = req.query;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    // Construir filtros
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
        // Si no tiene empresa, no retornar ningún producto
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
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
          // Si no tiene empresa, no retornar ningún producto
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          });
        }
      } else {
        // Si no tiene sucursal, no retornar ningún producto
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }
    // Super Admin puede ver todos los productos (no se agrega filtro de company)

    if (nombre) {
      filters.nombre = { $regex: nombre, $options: 'i' };
    }

    if (unidad) {
      filters.unidad = unidad;
    }

    if (estatus !== undefined) {
      filters.estatus = estatus === 'true';
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener productos con paginación
    const products = await Product.find(filters)
      .populate('productCategory', 'name description')
      .populate('company', 'legalName tradeName')
      .sort({ orden: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Product.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un producto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('productCategory', 'name description')
      .populate('company', 'legalName tradeName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo producto
const createProduct = async (req, res) => {
  try {
    const {
      nombre,
      unidad,
      descripcion,
      productCategory,
      orden,
      imagen,
      insumos,
      labour,
      precioVentaFinal,
      estatus = true
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!nombre || !unidad) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la unidad son obligatorios'
      });
    }

    // Obtener el company ID según el rol del usuario
    let companyId = null;

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');

    if (currentUser && currentUser.role) {
      const userRole = currentUser.role.name;

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
    }

    // Calcular totalCosto sumando los importeCosto de los insumos + mano de obra
    const costoInsumos = insumos?.reduce((sum, insumo) => sum + (insumo.importeCosto || 0), 0) || 0;
    const totalCosto = costoInsumos + (labour || 0);

    // Crear nuevo producto
    const newProduct = new Product({
      nombre: nombre.trim(),
      unidad,
      descripcion: descripcion?.trim() || '',
      productCategory: productCategory || null,
      orden: orden || 0,
      imagen: imagen || '',
      insumos: insumos || [],
      labour: labour || 0,
      totalCosto,
      totalVenta: precioVentaFinal || 0,
      estatus,
      company: companyId,
    });

    const savedProduct = await newProduct.save();

    // Popular la empresa para la respuesta
    await savedProduct.populate('company', 'legalName tradeName');

    res.status(201).json({
      success: true,
      data: savedProduct,
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear producto:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un producto
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      unidad,
      descripcion,
      productCategory,
      orden,
      imagen,
      insumos,
      labour,
      precioVentaFinal,
      estatus
    } = req.body;

    // Verificar si el producto existe
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre.trim();
    if (unidad) updateData.unidad = unidad;
    if (descripcion !== undefined) updateData.descripcion = descripcion.trim();
    if (productCategory !== undefined) updateData.productCategory = productCategory || null;
    if (orden !== undefined) updateData.orden = orden;
    if (imagen !== undefined) updateData.imagen = imagen;
    if (insumos !== undefined) {
      updateData.insumos = insumos;
    }
    if (labour !== undefined) updateData.labour = labour;

    // Recalcular totalCosto cuando se actualizan los insumos o el labour
    if (insumos !== undefined || labour !== undefined) {
      const costoInsumos = (insumos || existingProduct.insumos).reduce((sum, insumo) => sum + (insumo.importeCosto || 0), 0);
      const labourCost = labour !== undefined ? labour : existingProduct.labour;
      updateData.totalCosto = costoInsumos + labourCost;
    }

    if (precioVentaFinal !== undefined) updateData.totalVenta = precioVentaFinal;
    if (estatus !== undefined) updateData.estatus = estatus;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName');

    // Sincronizar ProductLists que contienen este producto
    try {
      const productLists = await ProductList.find({ 'products.productId': id });

      for (const productList of productLists) {
        const productIndex = productList.products.findIndex(
          p => p.productId.toString() === id
        );

        if (productIndex !== -1) {
          // Actualizar los campos del producto embebido
          productList.products[productIndex].nombre = updatedProduct.nombre;
          productList.products[productIndex].unidad = updatedProduct.unidad;
          productList.products[productIndex].descripcion = updatedProduct.descripcion;
          productList.products[productIndex].orden = updatedProduct.orden;
          productList.products[productIndex].imagen = updatedProduct.imagen || '';
          productList.products[productIndex].totalCosto = updatedProduct.totalCosto;
          productList.products[productIndex].totalVenta = updatedProduct.totalVenta;
          productList.products[productIndex].labour = updatedProduct.labour;
          productList.products[productIndex].estatus = updatedProduct.estatus;
          productList.products[productIndex].productCategory = updatedProduct.productCategory;
          productList.products[productIndex].insumos = updatedProduct.insumos.map(insumo => ({
            materialId: insumo.materialId || insumo._id,
            nombre: insumo.nombre,
            cantidad: insumo.cantidad,
            unidad: insumo.unidad,
            importeCosto: insumo.importeCosto,
            importeVenta: insumo.importeVenta
          }));

          await productList.save();
        }
      }

      console.log(`✅ Sincronizadas ${productLists.length} ProductLists con el producto ${updatedProduct.nombre}`);
    } catch (syncError) {
      console.error('Error al sincronizar ProductLists:', syncError);
      // No fallamos la actualización del producto por esto
    }

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Activar un producto
const activateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { estatus: true },
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Producto activado exitosamente'
    });
  } catch (error) {
    console.error('Error al activar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Desactivar un producto
const deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Producto desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de ventas de un producto
const getProductStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el producto existe
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Importar el modelo Order dinámicamente
    const Order = (await import('../models/Order.js')).default;

    // Contar órdenes que contienen este producto
    const ordersWithProduct = await Order.find({
      'items.productId': id
    });

    const orderCount = ordersWithProduct.length;

    // Sumar la cantidad total vendida
    let totalQuantitySold = 0;
    let totalRevenue = 0;

    ordersWithProduct.forEach(order => {
      order.items.forEach(item => {
        if (item.productId.toString() === id) {
          totalQuantitySold += item.quantity;
          totalRevenue += item.amount;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        orderCount,
        totalQuantitySold,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
  deactivateProduct,
  getProductStats
};
