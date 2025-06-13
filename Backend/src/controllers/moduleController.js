import { Module } from "../models/Module.js";
import { Page } from "../models/Page.js";
import { Role } from "../models/Roles.js";

const createModule = async (req, res) => {
  try {
    const { name, description, page } = req.body;

    if (!name || !page) {
      return res.status(400).json({
        success: false,
        message: "Name and page are required",
      });
    }

    const pageExists = await Page.findById(page);
    if (!pageExists) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const moduleExists = await Module.findOne({
      name: name.trim(),
      page: page,
    });

    if (moduleExists) {
      return res.status(400).json({
        success: false,
        message: "Module already exists with this name in the specified page",
      });
    }

    const module = await Module.create({
      name: name.trim(),
      description: description?.trim(),
      page,
    });

    await pageExists.addModule(module._id);

    await module.populate("page", "name description path");

    res.status(201).json({
      success: true,
      message: "Module created successfully",
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
      filters.status = req.query.status === "true";
    }
    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.pageId) {
      filters.page = req.query.pageId;
    }

    const modules = await Module.find(filters)
      .populate("page", "name description path status")
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
        pages: Math.ceil(total / limit),
      },
      data: modules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getModuleById = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate(
      "page",
      "name description path status"
    );

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    res.status(200).json({
      success: true,
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getModulesByPage = async (req, res) => {
  try {
    const { pageId } = req.params;

    const pageExists = await Page.findById(pageId);
    if (!pageExists) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const modules = await Module.find({ page: pageId })
      .populate("page", "name description path status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getModulesByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    await role.populate({
      path: "modules",
      match: { status: true },
      populate: {
        path: "page",
        select: "name description path status createdAt updatedAt",
      },
    });

    const pageMap = new Map();

    role.modules.forEach((module) => {
      if (module.page) {
        const pageId = module.page._id.toString();

        if (!pageMap.has(pageId)) {
          pageMap.set(pageId, {
            _id: module.page._id,
            name: module.page.name,
            description: module.page.description,
            path: module.page.path,
            status: module.page.status,
            createdAt: module.page.createdAt,
            updatedAt: module.page.updatedAt,
            __v: module.page.__v || 0,
            modules: [],
          });
        }

        pageMap.get(pageId).modules.push({
          _id: module._id,
          name: module.name,
          description: module.description,
          status: module.status,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
          __v: module.__v || 0,
        });
      }
    });

    const pagesWithModules = Array.from(pageMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    pagesWithModules.forEach((page) => {
      page.modules.sort((a, b) => a.name.localeCompare(b.name));
    });

    res.status(200).json({
      success: true,
      message: "Modules by role retrieved successfully",
      data: {
        role: {
          _id: role._id,
          name: role.name,
          description: role.description,
        },
        pages: pagesWithModules,
        totalPages: pagesWithModules.length,
        totalModules: role.modules.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
          message: "Page not found",
        });
      }

      // Verificar que no exista otro módulo con el mismo nombre en la nueva página
      const existingModule = await Module.findOne({
        name: name || req.body.name,
        page: page,
        _id: { $ne: req.params.id },
      });

      if (existingModule) {
        return res.status(400).json({
          success: false,
          message: "Module with this name already exists in the specified page",
        });
      }

      updateData.page = page;
    }

    const module = await Module.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("page", "name description path status");

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Module updated successfully",
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    ).populate("page", "name description path status");

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // También remover el módulo de todas las páginas que lo tengan asociado
    await Page.updateMany(
      { "modules.moduleId": req.params.id },
      { $pull: { modules: { moduleId: req.params.id } } }
    );

    res.status(200).json({
      success: true,
      message: "Module deactivated successfully",
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const activateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    ).populate("page", "name description path status");

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Module activated successfully",
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteModulePermanently = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // Remover el módulo de todas las páginas que lo tengan asociado
    await Page.updateMany(
      { "modules.moduleId": req.params.id },
      { $pull: { modules: { moduleId: req.params.id } } }
    );

    // Eliminar el módulo permanentemente
    await Module.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Module deleted permanently",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  activateModule,
  createModule,
  deleteModule,
  deleteModulePermanently,
  getAllModules,
  getModuleById,
  getModulesByPage,
  getModulesByRole,
  updateModule,
};
