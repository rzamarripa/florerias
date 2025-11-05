import { Neighborhood } from '../models/Neighborhood.js';

// Obtener todas las colonias con filtros y paginación
const getAllNeighborhoods = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search
    } = req.query;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Construir filtros
    const filters = {};

    if (status) {
      filters.status = status;
    }

    // Búsqueda por nombre
    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener colonias con paginación
    const neighborhoods = await Neighborhood.find(filters)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Neighborhood.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: neighborhoods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener colonias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una colonia por ID
const getNeighborhoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const neighborhood = await Neighborhood.findById(id);

    if (!neighborhood) {
      return res.status(404).json({
        success: false,
        message: 'Colonia no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: neighborhood
    });
  } catch (error) {
    console.error('Error al obtener colonia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva colonia
const createNeighborhood = async (req, res) => {
  try {
    const {
      name,
      priceDelivery,
      status = 'active'
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!name || priceDelivery === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre y precio de entrega son obligatorios'
      });
    }

    // Validar status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estatus inválido. Debe ser "active" o "inactive"'
      });
    }

    // Verificar si ya existe una colonia con el mismo nombre
    const existingNeighborhood = await Neighborhood.findOne({ name: name.trim() });
    if (existingNeighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una colonia con este nombre'
      });
    }

    // Crear nueva colonia
    const newNeighborhood = new Neighborhood({
      name,
      priceDelivery,
      status
    });

    const savedNeighborhood = await newNeighborhood.save();

    res.status(201).json({
      success: true,
      data: savedNeighborhood,
      message: 'Colonia creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear colonia:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una colonia con este nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar una colonia
const updateNeighborhood = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar si la colonia existe
    const existingNeighborhood = await Neighborhood.findById(id);
    if (!existingNeighborhood) {
      return res.status(404).json({
        success: false,
        message: 'Colonia no encontrada'
      });
    }

    // Validar status si se está actualizando
    if (updateData.status && !['active', 'inactive'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Estatus inválido. Debe ser "active" o "inactive"'
      });
    }

    // Si se está actualizando el nombre, verificar que no exista otra colonia con ese nombre
    if (updateData.name && updateData.name.trim() !== existingNeighborhood.name) {
      const duplicateNeighborhood = await Neighborhood.findOne({
        name: updateData.name.trim(),
        _id: { $ne: id }
      });

      if (duplicateNeighborhood) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una colonia con este nombre'
        });
      }
    }

    const updatedNeighborhood = await Neighborhood.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedNeighborhood,
      message: 'Colonia actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar colonia:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una colonia con este nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una colonia
const deleteNeighborhood = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const neighborhood = await Neighborhood.findById(id);

    if (!neighborhood) {
      return res.status(404).json({
        success: false,
        message: 'Colonia no encontrada'
      });
    }

    await Neighborhood.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Colonia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar colonia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllNeighborhoods,
  getNeighborhoodById,
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood
};
