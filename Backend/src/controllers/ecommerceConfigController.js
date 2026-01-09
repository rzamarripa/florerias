import EcommerceConfig from '../models/EcommerceConfig.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Obtener configuración por branchId
const getConfigByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ 
        success: false,
        message: 'Sucursal no encontrada' 
      });
    }

    let config = await EcommerceConfig.findOne({ branchId })
      .populate({ path: 'companyId', select: 'legalName tradeName' })
      .populate({ path: 'branchId', select: 'branchName address' });

    // Si no existe configuración, crear una por defecto
    if (!config) {
      config = await EcommerceConfig.create({
        companyId: branch.companyId,
        branchId: branchId,
        header: {
          businessName: branch.branchName
        }
      });
      
      config = await EcommerceConfig.findById(config._id)
        .populate({ path: 'companyId', select: 'legalName tradeName' })
        .populate({ path: 'branchId', select: 'branchName address' });
    }

    res.json({ 
      success: true, 
      data: config 
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la configuración',
      error: error.message 
    });
  }
};

// Crear configuración inicial
const createConfig = async (req, res) => {
  try {
    const { branchId, companyId, ...configData } = req.body;

    // Verificar si ya existe configuración para esta sucursal
    const existingConfig = await EcommerceConfig.findOne({ branchId });
    if (existingConfig) {
      // Si ya existe, actualizarla en lugar de crear una nueva
      const updatedConfig = await EcommerceConfig.findByIdAndUpdate(
        existingConfig._id,
        { ...configData },
        { new: true, runValidators: true }
      ).populate({ path: 'companyId', select: 'legalName tradeName' })
        .populate({ path: 'branchId', select: 'branchName address' });
      
      return res.json({ 
        success: true, 
        data: updatedConfig,
        message: 'Configuración actualizada correctamente' 
      });
    }

    // Verificar que la sucursal y empresa existen
    const branch = await Branch.findById(branchId);
    const company = await Company.findById(companyId);
    
    if (!branch || !company) {
      return res.status(404).json({ 
        success: false,
        message: 'Sucursal o empresa no encontrada' 
      });
    }

    const config = await EcommerceConfig.create({
      companyId,
      branchId,
      ...configData
    });

    const populatedConfig = await EcommerceConfig.findById(config._id)
      .populate({ path: 'companyId', select: 'legalName tradeName' })
      .populate({ path: 'branchId', select: 'branchName address' });

    res.status(201).json({ 
      success: true, 
      data: populatedConfig,
      message: 'Configuración creada correctamente' 
    });
  } catch (error) {
    console.error('Error al crear configuración:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear la configuración',
      error: error.message 
    });
  }
};

// Actualizar encabezado
const updateHeader = async (req, res) => {
  try {
    const { id } = req.params;
    const { header } = req.body;

    const config = await EcommerceConfig.findByIdAndUpdate(
      id,
      { header },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Configuración no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      data: config,
      message: 'Encabezado actualizado correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar encabezado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el encabezado',
      error: error.message 
    });
  }
};

// Actualizar plantilla
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body;

    const config = await EcommerceConfig.findByIdAndUpdate(
      id,
      { template },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Configuración no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      data: config,
      message: 'Plantilla actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar la plantilla',
      error: error.message 
    });
  }
};

// Actualizar colores
const updateColors = async (req, res) => {
  try {
    const { id } = req.params;
    const { colors } = req.body;

    const config = await EcommerceConfig.findByIdAndUpdate(
      id,
      { colors },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Configuración no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      data: config,
      message: 'Colores actualizados correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar colores:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar los colores',
      error: error.message 
    });
  }
};

// Actualizar tipografías
const updateTypography = async (req, res) => {
  try {
    const { id } = req.params;
    const { typography } = req.body;

    const config = await EcommerceConfig.findByIdAndUpdate(
      id,
      { typography },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Configuración no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      data: config,
      message: 'Tipografías actualizadas correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar tipografías:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar las tipografías',
      error: error.message 
    });
  }
};

// Actualizar elementos destacados
const updateFeaturedElements = async (req, res) => {
  try {
    const { id } = req.params;
    const { featuredElements } = req.body;

    const config = await EcommerceConfig.findByIdAndUpdate(
      id,
      { featuredElements },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Configuración no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      data: config,
      message: 'Elementos destacados actualizados correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar elementos destacados:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar los elementos destacados',
      error: error.message 
    });
  }
};

// Obtener configuración del gerente actual
const getManagerConfig = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log('Buscando sucursal para usuario ID:', userId);
    
    // Buscar la sucursal donde el usuario es gerente
    let branch = await Branch.findOne({ manager: userId });
    
    // Si no se encuentra por manager, buscar por administrator
    if (!branch) {
      console.log('No encontrado por manager, buscando por administrator...');
      branch = await Branch.findOne({ administrator: userId });
    }
    
    if (!branch) {
      console.log('Usuario no es manager ni administrator de ninguna sucursal');
      
      // Como último recurso, buscar la primera sucursal activa
      // Esto es temporal para desarrollo
      branch = await Branch.findOne({ isActive: true });
      
      if (!branch) {
        return res.status(404).json({ 
          success: false,
          message: 'No se encontró sucursal para este usuario' 
        });
      }
    }

    const config = await EcommerceConfig.findOne({ branchId: branch._id })
      .populate({ path: 'companyId', select: 'legalName tradeName' })
      .populate({ path: 'branchId', select: 'branchName address' });

    // Devolver la información aunque no exista configuración
    res.json({ 
      success: true, 
      data: {
        config: config || null,  // Puede ser null si no existe
        branch,
        companyId: branch.companyId
      }
    });
  } catch (error) {
    console.error('Error al obtener configuración del gerente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la configuración',
      error: error.message 
    });
  }
};

export {
  getConfigByBranch,
  createConfig,
  updateHeader,
  updateTemplate,
  updateColors,
  updateTypography,
  updateFeaturedElements,
  getManagerConfig
};