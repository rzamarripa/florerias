import { Role } from "../models/Roles.js";
import { Module } from "../models/Module.js";
import { roleService } from "../services/roleService.js";

const createRole = async (req, res) => {
  try {
    const role = await roleService.createRole(req.body);

    res.status(201).json({
      success: true,
      message: "Rol creado exitosamente",
      data: {
        _id: role._id,
        name: role.name,
        description: role.description,
        estatus: role.estatus,
        modules: role.modules,
        createdAt: role.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("Error getting roles:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await roleService.getRoleById(req.params.id);

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error getting role:", error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoleModules = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate({
      path: "modules",
      populate: {
        path: "page",
        select: "name path",
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    let modulesByPage = [];
    if (role.modules && role.modules.length > 0) {
      const grouped = {};
      role.modules.forEach((module) => {
        const pageKey = module.page._id.toString();
        if (!grouped[pageKey]) {
          grouped[pageKey] = {
            page: module.page.name,
            pageId: module.page._id,
            path: module.page.path,
            modules: [],
          };
        }
        grouped[pageKey].modules.push({
          name: module.name,
          _id: module._id,
        });
      });
      modulesByPage = Object.values(grouped);
    }

    res.status(200).json({
      success: true,
      data: {
        roleId: role._id,
        roleName: role.name,
        modulesByPage,
      },
    });
  } catch (error) {
    console.error("Error getting role modules:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Rol actualizado exitosamente",
      data: {
        _id: role._id,
        name: role.name,
        description: role.description,
        estatus: role.estatus,
        modules: role.modules,
        createdAt: role.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    await roleService.deleteRole(req.params.id);

    res.status(200).json({
      success: true,
      message: "Rol eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  getRoleModules,
  updateRole,
};
