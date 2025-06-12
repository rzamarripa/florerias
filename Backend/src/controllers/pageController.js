import { Page } from "../models/Page.js";
import { Module } from "../models/Module.js";

const createPage = async (req, res) => {
  try {
    const { name, description, path, modules } = req.body;

    // Verificar si la página ya existe
    const pageExists = await Page.findOne({ 
      $or: [
        { name: name.trim() },
        { path: path.trim() }
      ]
    });

    if (pageExists) {
      return res.status(400).json({
        success: false,
        message: 'Page already exists with this name or path'
      });
    }

    // Validar módulos si se proporcionan
    let validatedModules = [];
    if (modules && modules.length > 0) {
      for (const moduleData of modules) {
        const module = await Module.findById(moduleData.moduleId);
        if (!module) {
          return res.status(400).json({
            success: false,
            message: `Module with ID ${moduleData.moduleId} not found`
          });
        }
        validatedModules.push({
          moduleId: moduleData.moduleId,
          nombre: moduleData.nombre || module.name,
          description: moduleData.description || module.description
        });
      }
    }

    const page = await Page.create({
      name: name.trim(),
      description: description?.trim(),
      path: path.trim(),
      modules: validatedModules
    });

    // Popular la respuesta con información completa de módulos
    await page.populate('modules.moduleId', 'name description status');

    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllPages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtros opcionales
    const filters = {};
    if (req.query.status !== undefined) {
      filters.status = req.query.status === 'true';
    }
    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.path) {
      filters.path = { $regex: req.query.path, $options: 'i' };
    }

    const pages = await Page.find(filters)
      .populate('modules.moduleId', 'name description status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Page.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: pages.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: pages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('modules.moduleId', 'name description status');
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.status(200).json({
      success: true,
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updatePage = async (req, res) => {
  try {
    const { name, description, path, modules } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (path) updateData.path = path.trim();

    // Validar módulos si se proporcionan
    if (modules) {
      let validatedModules = [];
      for (const moduleData of modules) {
        const module = await Module.findById(moduleData.moduleId);
        if (!module) {
          return res.status(400).json({
            success: false,
            message: `Module with ID ${moduleData.moduleId} not found`
          });
        }
        validatedModules.push({
          moduleId: moduleData.moduleId,
          nombre: moduleData.nombre || module.name,
          description: moduleData.description || module.description
        });
      }
      updateData.modules = validatedModules;
    }

    const page = await Page.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('modules.moduleId', 'name description status');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Page updated successfully',
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deletePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Page deactivated successfully',
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const activatePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    ).populate('modules.moduleId', 'name description status');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Page activated successfully',
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const addModuleToPage = async (req, res) => {
  try {
    const { moduleId, nombre, description } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Module ID is required'
      });
    }

    // Verificar que el módulo exista
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Verificar si el módulo ya está asociado a la página
    const moduleExists = page.modules.some(m => 
      m.moduleId.toString() === moduleId.toString()
    );

    if (moduleExists) {
      return res.status(400).json({
        success: false,
        message: 'Module is already associated with this page'
      });
    }

    // Agregar el módulo
    const moduleData = {
      moduleId,
      nombre: nombre || module.name,
      description: description || module.description
    };

    await page.addModule(moduleData);
    await page.populate('modules.moduleId', 'name description status');

    res.status(200).json({
      success: true,
      message: 'Module added to page successfully',
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const removeModuleFromPage = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Verificar si el módulo está asociado a la página
    const moduleExists = page.modules.some(m => 
      m.moduleId.toString() === moduleId.toString()
    );

    if (!moduleExists) {
      return res.status(404).json({
        success: false,
        message: 'Module not found in this page'
      });
    }

    await page.removeModule(moduleId);
    await page.populate('modules.moduleId', 'name description status');

    res.status(200).json({
      success: true,
      message: 'Module removed from page successfully',
      data: page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createPage,
  getAllPages,
  getPageById,
  updatePage,
  deletePage,
  activatePage,
  addModuleToPage,
  removeModuleFromPage
};