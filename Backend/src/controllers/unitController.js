import Unit from '../models/Unit.js';

// Obtener todas las unidades con filtros y paginación
const getAllUnits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      name
    } = req.query;

    // Construir filtros
    const filters = {};

    if (status !== undefined) {
      filters.status = status === 'true';
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener unidades con paginación
    const units = await Unit.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Unit.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: units,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una unidad por ID
const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findById(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error al obtener unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva unidad
const createUnit = async (req, res) => {
  try {
    const { name, abbreviation } = req.body;

    // Validar campos requeridos
    if (!name || !abbreviation) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la abreviatura son obligatorios'
      });
    }

    // Crear nueva unidad
    const newUnit = new Unit({
      name,
      abbreviation
    });

    const savedUnit = await newUnit.save();

    res.status(201).json({
      success: true,
      data: savedUnit,
      message: 'Unidad creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear unidad:', error);

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
        message: 'Ya existe una unidad con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar una unidad
const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si la unidad existe
    const existingUnit = await Unit.findById(id);
    if (!existingUnit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    const updatedUnit = await Unit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUnit,
      message: 'Unidad actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar unidad:', error);

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
        message: 'Ya existe una unidad con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar estado de unidad
const updateUnitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const unit = await Unit.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: unit,
      message: 'Estado de unidad actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una unidad
const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUnit = await Unit.findByIdAndDelete(id);

    if (!deletedUnit) {
      return res.status(404).json({
        success: false,
        message: 'Unidad no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  updateUnitStatus,
  deleteUnit
};
