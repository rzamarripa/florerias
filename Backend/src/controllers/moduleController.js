import { Module } from "../models/Module.js";
import { Page } from "../models/Page.js";

const createModule = async (req, res) => {
  try {
    const { name, description, page } = req.body;

    if (!name || !page) {
      return res.status(400).json({
        success: false,
        message: 'Name and page are required'
      });
    }

    // Verificar que la página exista
    const pageExists = await Page.findById(page);
    if (!pageExists) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Verificar si el módulo ya existe en esa página
    const moduleExists = await Module.findOne({ 
      name: name.trim(),
      page: page
    });

    if (moduleExists) {
      return res.status(400).json({
        success: false,
        message: 'Module already exists with this name in the specified page'
      });
    }

    const module = await Module.create({
      name: name.trim(),
      description: description?.trim(),
      page
    });

    // Popular la respuesta con información de la página
    await module.populate('page', 'name description path');

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: module
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllModules = async (req, res) => {
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
    if (req.query.pageId) {
      filters.page = req.query.pageId;
    }

    const modules = await Module.find(filters)
      .populate('page', 'name description path status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Module.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: modules.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: modules
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getModuleById = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('page', 'name description path status');
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getModulesByPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verificar que la página exista
    const pageExists = await Page.findById(pageId);
    if (!pageExists) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const filters = { page: pageId };
    if (req.query.status !== undefined) {
      filters.status = req.query.status === 'true';
    }
    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: 'i' };
    }

    const modules = await Module.find(filters)
      .populate('page', 'name description path status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Module.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: modules.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: modules
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateModule = async (req, res) => {
  try {
    const { name, description, page } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    
    if (page) {
      // Verificar que la nueva página exista
      const pageExists = await Page.findById(page);
      if (!pageExists) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      // Verificar que no exista otro módulo con el mismo nombre en la nueva página
      const existingModule = await Module.findOne({
        name: name || req.body.name,
        page: page,
        _id: { $ne: req.params.id }
      });

      if (existingModule) {
        return res.status(400).json({
          success: false,
          message: 'Module with this name already exists in the specified page'
        });
      }

      updateData.page = page;
    }

    const module = await Module.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('page', 'name description path status');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    ).populate('page', 'name description path status');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // También remover el módulo de todas las páginas que lo tengan asociado
    await Page.updateMany(
      { 'modules.moduleId': req.params.id },
      { $pull: { modules: { moduleId: req.params.id } } }
    );

    res.status(200).json({
      success: true,
      message: 'Module deactivated successfully',
      data: module
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const activateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    ).populate('page', 'name description path status');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module activated successfully',
      data: module
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteModulePermanently = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Remover el módulo de todas las páginas que lo tengan asociado
    await Page.updateMany(
      { 'modules.moduleId': req.params.id },
      { $pull: { modules: { moduleId: req.params.id } } }
    );

    // Eliminar el módulo permanentemente
    await Module.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Module deleted permanently'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createModule,
  getAllModules,
  getModuleById,
  getModulesByPage,
  updateModule,
  deleteModule,
  activateModule,
  deleteModulePermanently
};