import ProductList from '../models/ProductList.js';
import Product from '../models/Product.js';
import { Company } from '../models/Company.js';
import { Storage } from '../models/Storage.js';

// Obtener todas las listas de productos con filtros y paginación
const getAllProductLists = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      companyId,
      status
    } = req.query;

    // Construir filtros
    const filters = {};

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    if (companyId) {
      filters.company = companyId;
    }

    if (status !== undefined) {
      filters.status = status === 'true';
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener listas con paginación
    const productLists = await ProductList.find(filters)
      .populate('company', 'legalName tradeName rfc')
      .populate('branch', 'branchName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await ProductList.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: productLists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener listas de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una lista de productos por ID
const getProductListById = async (req, res) => {
  try {
    const { id } = req.params;

    const productList = await ProductList.findById(id)
      .populate('company', 'legalName tradeName rfc')
      .populate('branch', 'branchName');

    if (!productList) {
      return res.status(404).json({
        success: false,
        message: 'Lista de productos no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: productList
    });
  } catch (error) {
    console.error('Error al obtener lista de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva lista de productos
const createProductList = async (req, res) => {
  try {
    const {
      name,
      products,
      company,
      branch,
      expirationDate
    } = req.body;

    // Validar campos requeridos
    if (!name || !company || !branch || !expirationDate) {
      return res.status(400).json({
        success: false,
        message: 'Los campos name, company, branch y expirationDate son obligatorios'
      });
    }

    // Validar que la empresa exista
    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: 'La empresa especificada no existe'
      });
    }

    // Verificar si ya existe una lista activa para esta sucursal
    const activeList = await ProductList.findOne({ branch, status: true });

    // Si existe una lista activa, la nueva lista se creará como inactiva
    const newListStatus = activeList ? false : true;

    // Si se proporcionan productos, validar que existan y embeber sus datos completos
    let embeddedProducts = [];
    if (products && products.length > 0) {
      for (const productData of products) {
        // Extraer productId y cantidad del objeto
        const productId = productData.productId || productData;
        const cantidad = productData.cantidad || 1;

        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `El producto con ID ${productId} no existe`
          });
        }

        // Debug: log para ver qué contiene el producto
        console.log('Product insumos:', JSON.stringify(product.insumos, null, 2));

        // Embeber el producto completo con insumos convertidos a objetos planos
        const mappedInsumos = product.insumos.map(insumo => {
          console.log('Insumo materialId:', insumo.materialId, '_id:', insumo._id);
          // Usar materialId si existe, sino usar el _id del insumo como fallback
          const materialIdValue = insumo.materialId || insumo._id;
          return {
            materialId: materialIdValue,
            nombre: insumo.nombre,
            cantidad: insumo.cantidad,
            unidad: insumo.unidad,
            importeCosto: insumo.importeCosto,
            importeVenta: insumo.importeVenta
          };
        });

        console.log('Mapped insumos:', JSON.stringify(mappedInsumos, null, 2));

        embeddedProducts.push({
          productId: product._id,
          nombre: product.nombre,
          unidad: product.unidad,
          descripcion: product.descripcion,
          orden: product.orden,
          imagen: product.imagen,
          insumos: mappedInsumos,
          cantidad: cantidad,
          totalCosto: product.totalCosto,
          totalVenta: product.totalVenta,
          labour: product.labour,
          estatus: product.estatus
        });
      }
    }

    // Crear nueva lista de productos
    const newProductList = new ProductList({
      name,
      products: embeddedProducts,
      company,
      branch,
      expirationDate,
      status: newListStatus
    });

    const savedProductList = await newProductList.save();

    // Popular la lista guardada antes de devolverla
    const populatedProductList = await ProductList.findById(savedProductList._id)
      .populate('company', 'legalName tradeName rfc')
      .populate('branch', 'branchName');

    res.status(201).json({
      success: true,
      data: populatedProductList,
      message: 'Lista de productos creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear lista de productos:', error);

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

// Actualizar una lista de productos
const updateProductList = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      products,
      company,
      branch,
      expirationDate,
      status
    } = req.body;

    // Verificar si la lista existe
    const existingProductList = await ProductList.findById(id);
    if (!existingProductList) {
      return res.status(404).json({
        success: false,
        message: 'Lista de productos no encontrada'
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate;
    if (status !== undefined) updateData.status = status;

    // Si se actualiza la empresa, validar que exista
    if (company) {
      const companyExists = await Company.findById(company);
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: 'La empresa especificada no existe'
        });
      }
      updateData.company = company;
    }

    // Si se actualiza la sucursal, simplemente permitirlo (puede haber múltiples listas por sucursal)
    if (branch && branch !== existingProductList.branch.toString()) {
      updateData.branch = branch;
    }

    // Si se está actualizando el estado a activo, desactivar otras listas de la misma sucursal
    if (status === true) {
      await ProductList.updateMany(
        {
          branch: updateData.branch || existingProductList.branch,
          _id: { $ne: id },
          status: true
        },
        { status: false }
      );
    }

    // Si se actualizan los productos, validar y embeber
    if (products !== undefined) {
      let embeddedProducts = [];
      if (products.length > 0) {
        for (const productData of products) {
          // Extraer productId y cantidad del objeto
          const productId = productData.productId || productData;
          const cantidad = productData.cantidad || 1;

          const product = await Product.findById(productId);
          if (!product) {
            return res.status(404).json({
              success: false,
              message: `El producto con ID ${productId} no existe`
            });
          }

          // Embeber el producto completo con insumos convertidos a objetos planos
          embeddedProducts.push({
            productId: product._id,
            nombre: product.nombre,
            unidad: product.unidad,
            descripcion: product.descripcion,
            orden: product.orden,
            imagen: product.imagen,
            insumos: product.insumos.map(insumo => ({
              materialId: insumo.materialId || insumo._id, // Fallback al _id si no existe materialId
              nombre: insumo.nombre,
              cantidad: insumo.cantidad,
              unidad: insumo.unidad,
              importeCosto: insumo.importeCosto,
              importeVenta: insumo.importeVenta
            })),
            cantidad: cantidad,
            totalCosto: product.totalCosto,
            totalVenta: product.totalVenta,
            labour: product.labour,
            estatus: product.estatus
          });
        }
      }
      updateData.products = embeddedProducts;
    }

    const updatedProductList = await ProductList.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName rfc')
     .populate('branch', 'branchName');

    res.status(200).json({
      success: true,
      data: updatedProductList,
      message: 'Lista de productos actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar lista de productos:', error);

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

// Actualizar estado de lista de productos (habilitar/inhabilitar)
const updateProductListStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    // Obtener la lista que se va a actualizar
    const targetList = await ProductList.findById(id);
    if (!targetList) {
      return res.status(404).json({
        success: false,
        message: 'Lista de productos no encontrada'
      });
    }

    // Si se está activando esta lista, desactivar todas las demás de la misma sucursal
    if (status === true) {
      await ProductList.updateMany(
        {
          branch: targetList.branch,
          _id: { $ne: id },
          status: true
        },
        { status: false }
      );
    }

    // Actualizar el estado de la lista objetivo
    const productList = await ProductList.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('company', 'legalName tradeName rfc')
     .populate('branch', 'branchName');

    res.status(200).json({
      success: true,
      data: productList,
      message: 'Estado de lista de productos actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de lista de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una lista de productos
const deleteProductList = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProductList = await ProductList.findByIdAndDelete(id);

    if (!deletedProductList) {
      return res.status(404).json({
        success: false,
        message: 'Lista de productos no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lista de productos eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar lista de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener lista de productos por sucursal con cantidades de almacén
const getProductListByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Buscar la lista de productos para esta sucursal
    const productList = await ProductList.findOne({ branch: branchId, status: true })
      .populate('company', 'legalName tradeName rfc')
      .populate('branch', 'branchName');

    if (!productList) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una lista de productos para esta sucursal'
      });
    }

    // Obtener el almacén correspondiente a la sucursal
    const storage = await Storage.findOne({ branch: branchId });

    // Mapear los productos de la lista con las cantidades del almacén
    const productsWithStock = productList.products.map(product => {
      let availableQuantity = 0;

      // Buscar el producto en el almacén
      if (storage) {
        const storageProduct = storage.products.find(
          sp => sp.productId.toString() === product.productId.toString()
        );
        if (storageProduct) {
          availableQuantity = storageProduct.quantity || 0;
        }
      }

      // Obtener el producto original para el precio
      return {
        ...product.toObject(),
        availableQuantity,
        hasStock: availableQuantity > 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...productList.toObject(),
        products: productsWithStock
      }
    });
  } catch (error) {
    console.error('Error al obtener lista de productos por sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllProductLists,
  getProductListById,
  createProductList,
  updateProductList,
  updateProductListStatus,
  deleteProductList,
  getProductListByBranch
};
