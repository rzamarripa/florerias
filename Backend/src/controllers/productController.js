import Product from '../models/Product.js';

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

    // Construir filtros
    const filters = {};

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

    const product = await Product.findById(id);

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
      orden,
      imagen,
      insumos,
      estatus = true
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !unidad) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la unidad son obligatorios'
      });
    }

    // Crear nuevo producto
    const newProduct = new Product({
      nombre: nombre.trim(),
      unidad,
      descripcion: descripcion?.trim() || '',
      orden: orden || 0,
      imagen: imagen || '',
      insumos: insumos || [],
      estatus
    });

    const savedProduct = await newProduct.save();

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
      orden,
      imagen,
      insumos,
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
    if (orden !== undefined) updateData.orden = orden;
    if (imagen !== undefined) updateData.imagen = imagen;
    if (insumos !== undefined) updateData.insumos = insumos;
    if (estatus !== undefined) updateData.estatus = estatus;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

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
    );

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
    );

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
